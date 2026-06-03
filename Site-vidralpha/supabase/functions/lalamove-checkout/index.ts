// ============================================================================
// Edge Function: lalamove-checkout
// Responsabilidade: Recebe os itens do carrinho, calcula o prazo escalonado,
// bate na API da Lalamove (Quotation → Place Order) e salva o pedido no banco.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

// ─── CONFIGURAÇÃO (insira suas chaves aqui ou via Supabase Secrets) ───────────
// Para configurar via CLI: supabase secrets set LALAMOVE_API_KEY=xxx LALAMOVE_API_SECRET=yyy
const LALAMOVE_API_KEY    = Deno.env.get("LALAMOVE_API_KEY") ?? "";   // 👈 Inserir chave aqui
const LALAMOVE_API_SECRET = Deno.env.get("LALAMOVE_API_SECRET") ?? ""; // 👈 Inserir secret aqui
const LALAMOVE_BASE_URL   = Deno.env.get("LALAMOVE_BASE_URL") ?? "https://rest.sandbox.lalamove.com"; // Trocar para https://rest.lalamove.com em produção
const LALAMOVE_MARKET     = Deno.env.get("LALAMOVE_MARKET") ?? "BR";

const SUPABASE_URL        = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Cabeçalhos CORS para o frontend React
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ─── HELPER: Gera a assinatura HMAC-SHA256 para a Lalamove API v3 ─────────────
async function gerarAssinaturaLalamove(
  metodo: string,
  caminho: string,
  timestamp: string,
  corpo: string
): Promise<string> {
  // Formato: "{timestamp}\r\n{METODO}\r\n{/caminho}\r\n\r\n{corpo}"
  const mensagemBruta = `${timestamp}\r\n${metodo}\r\n${caminho}\r\n\r\n${corpo}`;

  const chaveSecreta = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(LALAMOVE_API_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chaveSecreta,
    new TextEncoder().encode(mensagemBruta)
  );

  // Converte para hex
  return Array.from(new Uint8Array(assinatura))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── HELPER: Faz requisição autenticada para a Lalamove API v3 ────────────────
async function requestLalamove(
  metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  caminho: string,
  corpo?: object
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  const timestamp = String(Date.now());
  const corpoStr  = corpo ? JSON.stringify(corpo) : "";
  const assinatura = await gerarAssinaturaLalamove(metodo, caminho, timestamp, corpoStr);

  // Token no formato: {API_KEY}:{timestamp}:{assinatura}
  const token = `${LALAMOVE_API_KEY}:${timestamp}:${assinatura}`;

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
    console.error("[Lalamove] Erro na requisição:", JSON.stringify(dados));
    return { ok: false, error: dados?.message ?? "Erro desconhecido na Lalamove" };
  }

  return { ok: true, data: dados };
}

// ─── HELPER: Adiciona N dias úteis a uma data ─────────────────────────────────
function adicionarDiasUteis(dataInicio: Date, dias: number): Date {
  const data = new Date(dataInicio.getTime());
  let contador = 0;

  while (contador < dias) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      contador++;
    }
  }

  return data;
}

// ─── LÓGICA CENTRAL: Calcula o prazo final do pedido ─────────────────────────
// Regra: prazo_item = prazo_base + ((quantidade - 1) * dias_extras_por_unidade)
// Prazo do pedido = MAX(prazo de todos os itens)
function calcularPrazoFinal(itensPedido: Array<{
  prazo_base: number;
  dias_extras_por_unidade: number;
  quantity: number;
}>): number {
  if (!itensPedido || itensPedido.length === 0) return 5; // fallback padrão

  const prazos = itensPedido.map(item => {
    const prazoBase          = item.prazo_base ?? 5;
    const diasExtras         = item.dias_extras_por_unidade ?? 1;
    const quantidade         = item.quantity ?? 1;
    return prazoBase + ((quantidade - 1) * diasExtras);
  });

  return Math.max(...prazos);
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // 1. Autenticação do usuário via JWT do Supabase
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

    // 2. Parse do corpo da requisição
    const { itens, enderecoEntrega, enderecoColeta } = await req.json();
    // itens: [{ product_id, prazo_base, dias_extras_por_unidade, quantity, price, name }]
    // enderecoEntrega: { lat, lng, address }
    // enderecoColeta: { lat, lng, address } — endereço da fábrica

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return new Response(JSON.stringify({ error: "Carrinho vazio" }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    // 3. Calcula o prazo em dias úteis
    const prazoEmDiasUteis = calcularPrazoFinal(itens);
    console.log(`[Checkout] Prazo calculado: ${prazoEmDiasUteis} dias úteis`);

    // 4. Calcula a data de coleta (prazo a partir de hoje, às 09:00 BRT = 12:00 UTC)
    const agora = new Date();
    const dataColeta = adicionarDiasUteis(agora, prazoEmDiasUteis);
    // Lalamove usa UTC. 09:00 BRT = 12:00 UTC (UTC-3)
    dataColeta.setUTCHours(12, 0, 0, 0);
    const scheduleAtISO = dataColeta.toISOString();
    console.log(`[Checkout] Data de coleta agendada: ${scheduleAtISO}`);

    // 5. Monta payload da COTAÇÃO (Quotation)
    const payloadCotacao = {
      data: {
        serviceType: "MOTORCYCLE",  // Ajuste conforme o veículo necessário
        language: "pt_BR",
        stops: [
          {
            coordinates: {
              lat: String(enderecoColeta?.lat ?? "-23.5505"), // 👈 Lat/Lng da fábrica
              lng: String(enderecoColeta?.lng ?? "-46.6333"),
            },
            address: enderecoColeta?.address ?? "Endereço da Fábrica Vidralpha",
          },
          {
            coordinates: {
              lat: String(enderecoEntrega?.lat ?? "-23.5505"),
              lng: String(enderecoEntrega?.lng ?? "-46.6333"),
            },
            address: enderecoEntrega?.address ?? "Endereço do Cliente",
          },
        ],
        scheduleAt: scheduleAtISO,
        item: {
          quantity: "1",
          weight:   "LESS_THAN_3KG",
          categories: ["WINDOW"],
        },
      },
    };

    // 6. Chama o endpoint de Quotation
    const resultCotacao = await requestLalamove("POST", "/v3/quotations", payloadCotacao);
    if (!resultCotacao.ok) {
      return new Response(JSON.stringify({
        error: "Erro ao gerar cotação Lalamove: " + resultCotacao.error,
      }), { status: 502, headers: CORS_HEADERS });
    }

    const cotacao = resultCotacao.data as { data: { quotationId: string; priceBreakdown: { total: string } } };
    const quotationId   = cotacao?.data?.quotationId;
    const precoFrete    = parseFloat(cotacao?.data?.priceBreakdown?.total ?? "0");

    console.log(`[Checkout] Cotação OK. ID: ${quotationId}, Preço: R$${precoFrete}`);

    // 7. Monta payload do PEDIDO (Place Order) — trava o preço
    const totalProdutos = itens.reduce((soma: number, item: { price: number; quantity: number }) =>
      soma + (item.price * item.quantity), 0
    );

    const payloadPedido = {
      data: {
        quotationId,  // ID da cotação para cravar o preço
        sender: {
          stopIndex: "0",
          name:      "Vidralpha Fábrica",          // 👈 Nome do remetente
          phone:     Deno.env.get("LALAMOVE_SENDER_PHONE") ?? "+5511999999999", // 👈 Telefone
        },
        recipients: [
          {
            stopIndex: "1",
            name:      user.email ?? "Cliente",
            phone:     enderecoEntrega?.phone ?? "+5511999999999",
          },
        ],
        isRecipientSMSEnabled: true,
        isPODEnabled: false,
        item: payloadCotacao.data.item,
        metadata: {
          orderId: user.id,
        },
      },
    };

    // 8. Chama o endpoint Place Order — CRAVO DO PREÇO
    const resultPedido = await requestLalamove("POST", "/v3/orders", payloadPedido);
    if (!resultPedido.ok) {
      return new Response(JSON.stringify({
        error: "Erro ao criar pedido na Lalamove: " + resultPedido.error,
      }), { status: 502, headers: CORS_HEADERS });
    }

    const pedidoLala = resultPedido.data as { data: { orderId: string; shareLink?: string } };
    const lalamoveOrderId = pedidoLala?.data?.orderId;
    const shareLink       = pedidoLala?.data?.shareLink ?? null;

    console.log(`[Checkout] Pedido Lalamove criado! ID: ${lalamoveOrderId}`);

    // 9. Salva o pedido na tabela `orders` do Supabase
    const { data: novoPedido, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id:              user.id,
        items:                itens,
        total_price:          totalProdutos + precoFrete,
        freight_price:        precoFrete,
        status:               "confirmed",
        status_producao:      "Pendente",
        lalamove_order_id:    lalamoveOrderId,
        lalamove_quotation_id: quotationId,
        schedule_at:          scheduleAtISO,
        lalamove_share_link:  shareLink,
        delivery_address:     enderecoEntrega,
        prazo_dias_uteis:     prazoEmDiasUteis,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[DB] Erro ao salvar pedido:", dbError);
      // Pedido criado na Lalamove mas falhou no banco — logar para reconciliação manual
      return new Response(JSON.stringify({
        error: "Pedido criado na Lalamove mas falhou ao salvar no banco. Contate o suporte.",
        lalamoveOrderId,
      }), { status: 500, headers: CORS_HEADERS });
    }

    // 10. Limpa o carrinho do usuário no banco
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    // 11. Retorna sucesso ao frontend
    return new Response(JSON.stringify({
      success: true,
      pedidoId:         novoPedido.id,
      lalamoveOrderId,
      scheduleAt:       scheduleAtISO,
      prazoEmDiasUteis,
      precoFrete,
      shareLink,
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error("[lalamove-checkout] Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
});
