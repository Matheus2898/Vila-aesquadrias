// ============================================================================
// Edge Function: lalamove-edit-order
// Responsabilidade: Edita a data de coleta de um pedido existente na Lalamove.
// Usado pelo botão "Produção Concluída" quando o admin quer antecipar a coleta.
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

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const chave = await crypto.subtle.importKey(
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
    console.error("[Lalamove Edit] Erro:", JSON.stringify(dados));
    return { ok: false, error: dados?.message ?? "Erro na Lalamove" };
  }

  return { ok: true, data: dados };
}

// ─── HELPER: Adiciona dias úteis ──────────────────────────────────────────────
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

  try {
    // 1. Autenticação — apenas admins podem chamar esta rota
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: CORS_HEADERS,
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token    = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: CORS_HEADERS,
      });
    }

    // Verifica se é admin
    const { data: perfil } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (perfil?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403, headers: CORS_HEADERS,
      });
    }

    // 2. Parse do corpo
    const { orderId, novaDataColeta, diasUteisParaAdicionar } = await req.json();
    // orderId: ID interno do pedido no Supabase
    // novaDataColeta: ISO string direto (opcional)
    // diasUteisParaAdicionar: número (opcional, calcula a nova data)

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId é obrigatório" }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    // 3. Busca o pedido no banco
    const { data: pedido, error: pedidoError } = await supabase
      .from("orders")
      .select("id, lalamove_order_id, schedule_at, status_producao")
      .eq("id", orderId)
      .single();

    if (pedidoError || !pedido) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404, headers: CORS_HEADERS,
      });
    }

    if (!pedido.lalamove_order_id) {
      return new Response(JSON.stringify({ error: "Este pedido não possui um Order ID da Lalamove" }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    // 4. Calcula a nova data de coleta
    let novaDataISO: string;

    if (novaDataColeta) {
      // Data explícita fornecida pelo caller
      novaDataISO = novaDataColeta;
    } else if (diasUteisParaAdicionar && diasUteisParaAdicionar > 0) {
      // Adiciona X dias úteis a partir da data atual de coleta (usado pelo Cron Job)
      const dataAtualColeta = pedido.schedule_at ? new Date(pedido.schedule_at) : new Date();
      const novaData = adicionarDiasUteis(dataAtualColeta, diasUteisParaAdicionar);
      // Mantém às 09:00 BRT = 12:00 UTC
      novaData.setUTCHours(12, 0, 0, 0);
      novaDataISO = novaData.toISOString();
    } else {
      // Padrão: amanhã às 09:00 BRT (antecipação manual)
      const amanha = adicionarDiasUteis(new Date(), 1);
      amanha.setUTCHours(12, 0, 0, 0);
      novaDataISO = amanha.toISOString();
    }

    console.log(`[Edit Order] Pedido ${orderId} | Lalamove: ${pedido.lalamove_order_id} | Nova data: ${novaDataISO}`);

    // 5. Chama o endpoint Edit Order da Lalamove
    const caminho = `/v3/orders/${pedido.lalamove_order_id}`;
    const payloadEdicao = {
      data: {
        scheduleAt: novaDataISO,
      },
    };

    const resultEdicao = await requestLalamove("PUT", caminho, payloadEdicao);

    if (!resultEdicao.ok) {
      return new Response(JSON.stringify({
        error: "Erro ao editar pedido na Lalamove: " + resultEdicao.error,
      }), { status: 502, headers: CORS_HEADERS });
    }

    console.log(`[Edit Order] Lalamove respondeu OK! Nova data: ${novaDataISO}`);

    // 6. Atualiza o schedule_at no banco de dados
    const updatePayload: Record<string, unknown> = { schedule_at: novaDataISO };

    // Se o chamador também quer atualizar o status de produção
    if (req.url.includes("producao_concluida")) {
      updatePayload.status_producao = "Concluída";
    }

    const { error: updateError } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (updateError) {
      console.error("[DB] Erro ao atualizar schedule_at:", updateError);
      // A Lalamove foi atualizada mas o banco falhou — logar
      return new Response(JSON.stringify({
        warning: "Lalamove atualizada mas banco falhou ao sincronizar",
        novaDataISO,
      }), { status: 207, headers: CORS_HEADERS });
    }

    return new Response(JSON.stringify({
      success: true,
      novaDataColeta: novaDataISO,
      lalamoveOrderId: pedido.lalamove_order_id,
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error("[lalamove-edit-order] Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
});
