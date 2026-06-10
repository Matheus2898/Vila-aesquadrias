// ============================================================================
// Edge Function: lalamove-checkout
// Responsabilidade: Recebe os itens do carrinho + frete já selecionado,
// salva o pedido no banco e cria a preferência de pagamento no Mercado Pago.
// A integração Lalamove (Place Order) acontece depois via Webhook do MP.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";

// Lalamove (opcional – para usar Place Order após pagamento via webhook)
const LALAMOVE_API_KEY    = Deno.env.get("LALAMOVE_API_KEY") ?? "";
const LALAMOVE_API_SECRET = Deno.env.get("LALAMOVE_API_SECRET") ?? "";
const LALAMOVE_BASE_URL   = Deno.env.get("LALAMOVE_BASE_URL") ?? "https://rest.sandbox.lalamove.com";
const LALAMOVE_MARKET     = Deno.env.get("LALAMOVE_MARKET") ?? "BR";

// Cabeçalhos CORS para o frontend React
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ─── HELPER: Adiciona N dias úteis a uma data ─────────────────────────────────
function adicionarDiasUteis(dataInicio: Date, dias: number): Date {
  const data = new Date(dataInicio.getTime());
  let contador = 0;
  while (contador < dias) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) contador++;
  }
  return data;
}

// ─── LÓGICA: Calcula o prazo final do pedido ─────────────────────────────────
function calcularPrazoFinal(itensPedido: Array<{
  prazo_base: number;
  dias_extras_por_unidade: number;
  quantity: number;
}>): number {
  if (!itensPedido || itensPedido.length === 0) return 5;
  const prazos = itensPedido.map(item => {
    const prazoBase  = item.prazo_base ?? 5;
    const diasExtras = item.dias_extras_por_unidade ?? 1;
    const quantidade = item.quantity ?? 1;
    return prazoBase + ((quantidade - 1) * diasExtras);
  });
  return Math.max(...prazos);
}

// ─── HELPER: Assinatura Lalamove (usada pelo webhook de Place Order) ──────────
async function gerarAssinaturaLalamove(metodo: string, caminho: string, timestamp: string, corpo: string): Promise<string> {
  const msg = `${timestamp}\r\n${metodo}\r\n${caminho}\r\n\r\n${corpo}`;
  const chave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(LALAMOVE_API_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
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
    // itens: [{ product_id, prazo_base, dias_extras_por_unidade, quantity, price, name }]
    // enderecoEntrega: { lat, lng, address, cep }
    // freteInfo: { vehicle, price, time } — frete já selecionado pelo usuário
    const { itens, enderecoEntrega, freteInfo } = await req.json();

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return new Response(JSON.stringify({ error: "Carrinho vazio" }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    // 3. Calcula o prazo em dias úteis baseado nos produtos
    const prazoEmDiasUteis = calcularPrazoFinal(itens);
    console.log(`[Checkout] Prazo calculado: ${prazoEmDiasUteis} dias úteis`);

    // 4. Calcula a data de coleta
    const agora = new Date();
    const dataColeta = adicionarDiasUteis(agora, prazoEmDiasUteis);
    dataColeta.setUTCHours(12, 0, 0, 0);
    const scheduleAtISO = dataColeta.toISOString();

    // 5. Preço do frete (já calculado pelo frontend via lalamove-quote)
    const precoFrete = freteInfo?.price ? Number(freteInfo.price) : 0;
    const veiculoFrete = freteInfo?.vehicle ?? "Padrão";
    const lalamoveQuotationId = freteInfo?.quotationId ?? null;

    console.log(`[Checkout] Frete selecionado: ${veiculoFrete} = R$${precoFrete}, Quotation: ${lalamoveQuotationId}`);

    // 6. Salva o pedido na tabela `orders` com status pending_payment
    const totalProdutos = itens.reduce((soma: number, item: { price: number; quantity: number }) =>
      soma + (item.price * item.quantity), 0
    );

    const { data: novoPedido, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id:          user.id,
        items:            itens,
        total_price:      totalProdutos + precoFrete,
        freight_price:    precoFrete,
        freight_vehicle:  veiculoFrete,
        status:           "pending_payment",
        status_producao:  "Pendente",
        schedule_at:      scheduleAtISO,
        delivery_address: enderecoEntrega,
        prazo_dias_uteis: prazoEmDiasUteis,
        lalamove_quotation_id: lalamoveQuotationId,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[DB] Erro ao salvar pedido:", dbError);
      return new Response(JSON.stringify({
        error: "Erro ao criar pedido no banco de dados.",
      }), { status: 500, headers: CORS_HEADERS });
    }

    console.log(`[Checkout] Pedido criado: ${novoPedido.id}`);

    // 7. Verifica se tem token do Mercado Pago
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error("[Checkout] MERCADOPAGO_ACCESS_TOKEN não configurado!");
      return new Response(JSON.stringify({
        error: "Pagamento não configurado. Contate o suporte.",
      }), { status: 500, headers: CORS_HEADERS });
    }

    // 8. Cria a Preferência no Mercado Pago
    const origin = req.headers.get("origin") ?? "https://vilacaesquadrias.com.br";

    const mpItems = itens.map((item: any) => ({
      id: String(item.product_id),
      title: item.name || "Produto Vidralpha",
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      currency_id: "BRL",
    }));

    if (precoFrete > 0) {
      mpItems.push({
        id: "frete",
        title: `Frete – ${veiculoFrete}`,
        quantity: 1,
        unit_price: Number(precoFrete.toFixed(2)),
        currency_id: "BRL",
      });
    }

    const preferencePayload = {
      items: mpItems,
      payer: {
        email: user.email,
        name: user.user_metadata?.full_name ?? "Cliente",
      },
      back_urls: {
        success: `${origin}/profile`,
        failure: `${origin}/carrinho`,
        pending: `${origin}/carrinho`,
      },
      auto_return: "approved",
      external_reference: novoPedido.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mercadopago-webhook`,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("[Mercado Pago] Erro ao criar preferência:", JSON.stringify(mpData));
      // Deleta o pedido criado para não deixar órfão
      await supabase.from("orders").delete().eq("id", novoPedido.id);
      return new Response(JSON.stringify({
        error: `Erro ao inicializar pagamento: ${mpData?.message ?? "Erro desconhecido"}`,
      }), { status: 502, headers: CORS_HEADERS });
    }

    console.log(`[Checkout] Preferência MP criada: ${mpData.id}`);

    // 9. Limpa o carrinho do usuário
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    // 10. Retorna sucesso com o ID da preferência
    return new Response(JSON.stringify({
      success: true,
      pedidoId:         novoPedido.id,
      preferenceId:     mpData.id,
      checkoutUrl:      mpData.init_point,    // URL de pagamento (produção)
      sandboxUrl:       mpData.sandbox_init_point, // URL sandbox
      scheduleAt:       scheduleAtISO,
      prazoEmDiasUteis,
      precoFrete,
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    console.error("[lalamove-checkout] Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
});
