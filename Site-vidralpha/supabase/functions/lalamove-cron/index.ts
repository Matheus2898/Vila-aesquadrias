// ============================================================================
// Edge Function: lalamove-cron
// Responsabilidade: Worker de segurança que roda a cada hora.
// Busca pedidos com coleta daqui a ≤24h E status_producao ≠ 'Concluída',
// e empurra automaticamente o scheduleAt em +2 dias úteis na Lalamove.
//
// Para agendar no Supabase Cron, execute no SQL Editor do Supabase:
//   select cron.schedule(
//     'lalamove-adiamento-preventivo',
//     '0 * * * *',
//     $$ select net.http_post(
//       url := '<SUPABASE_URL>/functions/v1/lalamove-cron',
//       headers := '{"Authorization": "Bearer <SUPABASE_SERVICE_ROLE_KEY>"}'::jsonb,
//       body := '{}'::jsonb
//     ) $$
//   );
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// ─── CONFIGURAÇÃO ─────────────────────────────────────────────────────────────
const LALAMOVE_API_KEY    = Deno.env.get("LALAMOVE_API_KEY") ?? "";    // 👈 Inserir chave
const LALAMOVE_API_SECRET = Deno.env.get("LALAMOVE_API_SECRET") ?? ""; // 👈 Inserir secret
const LALAMOVE_BASE_URL   = Deno.env.get("LALAMOVE_BASE_URL") ?? "https://rest.sandbox.lalamove.com";
const LALAMOVE_MARKET     = Deno.env.get("LALAMOVE_MARKET") ?? "BR";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Chave interna para proteger o endpoint do Cron Job de chamadas externas não autorizadas
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? ""; // 👈 Defina um secret aleatório

const CORS_HEADERS = {
  "Content-Type": "application/json",
};

// ─── HELPER: Assinatura HMAC-SHA256 ──────────────────────────────────────────
async function gerarAssinatura(
  metodo: string,
  caminho: string,
  timestamp: string,
  corpo: string
): Promise<string> {
  const mensagem = `${timestamp}\r\n${metodo}\r\n${caminho}\r\n\r\n${corpo}`;
  const chave    = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(LALAMOVE_API_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const assinatura = await crypto.subtle.sign(
    "HMAC", chave, new TextEncoder().encode(mensagem)
  );
  return Array.from(new Uint8Array(assinatura))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── HELPER: Requisição autenticada Lalamove ──────────────────────────────────
async function requestLalamove(
  metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  caminho: string,
  corpo?: object
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const timestamp  = String(Date.now());
  const corpoStr   = corpo ? JSON.stringify(corpo) : "";
  const assinatura = await gerarAssinatura(metodo, caminho, timestamp, corpoStr);
  const token      = `${LALAMOVE_API_KEY}:${timestamp}:${assinatura}`;

  const resposta = await fetch(`${LALAMOVE_BASE_URL}${caminho}`, {
    method: metodo,
    headers: {
      "Authorization": `hmac ${token}`,
      "Content-Type": "application/json",
      "Market": LALAMOVE_MARKET,
      "Request-ID": crypto.randomUUID(),
    },
    body: corpoStr || undefined,
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    console.error("[Lalamove Cron] Erro na chamada:", JSON.stringify(dados));
    return { ok: false, error: dados?.message ?? "Erro na Lalamove" };
  }
  return { ok: true, data: dados };
}

// ─── HELPER: Adiciona N dias úteis a uma data ─────────────────────────────────
function adicionarDiasUteis(dataInicio: Date, dias: number): Date {
  const data = new Date(dataInicio.getTime());
  let contador = 0;
  while (contador < dias) {
    data.setDate(data.getDate() + 1);
    if (data.getDay() !== 0 && data.getDay() !== 6) contador++;
  }
  return data;
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Verifica autenticação do Cron Job
  // Aceita via Authorization: Bearer <SERVICE_ROLE_KEY> (chamada interna do Supabase)
  // ou via header x-cron-secret: <CRON_SECRET>
  const cronSecretHeader = req.headers.get("x-cron-secret");
  const authHeader       = req.headers.get("Authorization") ?? "";
  const isCronAuthorized =
    (CRON_SECRET && cronSecretHeader === CRON_SECRET) ||
    authHeader.includes(SUPABASE_SERVICE_KEY);

  if (!isCronAuthorized) {
    console.warn("[Cron] Tentativa de acesso não autorizado.");
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401, headers: CORS_HEADERS,
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const agora     = new Date();
  const em24horas = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  console.log(`[Cron] Executando às ${agora.toISOString()} | Janela: até ${em24horas.toISOString()}`);

  try {
    // ── 1. Busca pedidos em risco: coleta daqui a ≤24h E produção NÃO concluída
    const { data: pedidosEmRisco, error: queryError } = await supabase
      .from("orders")
      .select("id, lalamove_order_id, schedule_at, status_producao, prazo_dias_uteis")
      .neq("status_producao", "Concluída")       // Produção ainda não finalizou
      .neq("status", "cancelled")               // Pedido não cancelado
      .not("lalamove_order_id", "is", null)      // Tem ID na Lalamove
      .lte("schedule_at", em24horas.toISOString()) // Coleta daqui a ≤24h
      .gte("schedule_at", agora.toISOString());   // Coleta ainda não aconteceu

    if (queryError) {
      console.error("[Cron] Erro ao buscar pedidos:", queryError);
      return new Response(JSON.stringify({ error: "Erro ao buscar pedidos: " + queryError.message }), {
        status: 500, headers: CORS_HEADERS,
      });
    }

    if (!pedidosEmRisco || pedidosEmRisco.length === 0) {
      console.log("[Cron] Nenhum pedido em risco encontrado. Tudo ok! ✅");
      return new Response(JSON.stringify({
        success: true,
        processados: 0,
        mensagem: "Nenhum pedido em risco encontrado.",
      }), { status: 200, headers: CORS_HEADERS });
    }

    console.log(`[Cron] ⚠️ ${pedidosEmRisco.length} pedido(s) em risco encontrado(s)!`);

    const resultados: Array<{
      pedidoId: string;
      lalamoveOrderId: string;
      status: "adiado" | "erro" | "sem_id_lalamove";
      novaData?: string;
      erro?: string;
    }> = [];

    // ── 2. Para cada pedido em risco, empurra +2 dias úteis na Lalamove
    for (const pedido of pedidosEmRisco) {
      if (!pedido.lalamove_order_id) {
        console.warn(`[Cron] Pedido ${pedido.id} sem lalamove_order_id, ignorando.`);
        resultados.push({ pedidoId: pedido.id, lalamoveOrderId: "", status: "sem_id_lalamove" });
        continue;
      }

      try {
        // Calcula nova data: data_atual_coleta + 2 dias úteis
        const dataAtualColeta = new Date(pedido.schedule_at);
        const novaDataColeta  = adicionarDiasUteis(dataAtualColeta, 2);
        // Mantém às 09:00 BRT = 12:00 UTC
        novaDataColeta.setUTCHours(12, 0, 0, 0);
        const novaDataISO = novaDataColeta.toISOString();

        console.log(`[Cron] Adiando pedido ${pedido.id} | ${pedido.lalamove_order_id} | ${pedido.schedule_at} → ${novaDataISO}`);

        // Chama Edit Order na Lalamove (+2 dias úteis)
        const caminho       = `/v3/orders/${pedido.lalamove_order_id}`;
        const resultEdicao  = await requestLalamove("PUT", caminho, {
          data: { scheduleAt: novaDataISO },
        });

        if (!resultEdicao.ok) {
          console.error(`[Cron] Falha ao adiar pedido ${pedido.id}:`, resultEdicao.error);
          resultados.push({
            pedidoId:        pedido.id,
            lalamoveOrderId: pedido.lalamove_order_id,
            status: "erro",
            erro: resultEdicao.error,
          });
          continue;
        }

        // Atualiza o schedule_at no banco para refletir o adiamento
        const { error: updateError } = await supabase
          .from("orders")
          .update({ schedule_at: novaDataISO })
          .eq("id", pedido.id);

        if (updateError) {
          console.error(`[Cron] Erro ao atualizar banco para pedido ${pedido.id}:`, updateError);
          // Mesmo com erro no banco, a Lalamove foi atualizada
          // Logar para reconciliação manual
        }

        console.log(`[Cron] ✅ Pedido ${pedido.id} adiado com sucesso para ${novaDataISO}`);
        resultados.push({
          pedidoId:        pedido.id,
          lalamoveOrderId: pedido.lalamove_order_id,
          status:          "adiado",
          novaData:        novaDataISO,
        });

      } catch (err) {
        console.error(`[Cron] Erro inesperado no pedido ${pedido.id}:`, err);
        resultados.push({
          pedidoId:        pedido.id,
          lalamoveOrderId: pedido.lalamove_order_id ?? "",
          status: "erro",
          erro: String(err),
        });
      }
    }

    // ── 3. Sumário de execução
    const adiados = resultados.filter(r => r.status === "adiado").length;
    const erros   = resultados.filter(r => r.status === "erro").length;

    console.log(`[Cron] Conclusão: ${adiados} adiado(s), ${erros} erro(s).`);

    return new Response(JSON.stringify({
      success: true,
      processados:    pedidosEmRisco.length,
      adiados,
      erros,
      resultados,
      executadoEm:    agora.toISOString(),
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error("[lalamove-cron] Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
});
