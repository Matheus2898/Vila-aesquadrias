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

// Resposta de erro que SEMPRE retorna 200 para o cliente ver a mensagem real
function errResponse(msg: string) {
  console.error("[checkout-error]", msg);
  return new Response(JSON.stringify({ error: msg }), {
    status: 200, headers: CORS_HEADERS,
  });
}

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

// ─── HELPER: Assinatura Lalamove ──────────────────────────────────────────────
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // 1. Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return errResponse("ERRO: Sem header de autenticação. Faça login novamente.");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const token    = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return errResponse(`ERRO AUTH: ${authError?.message ?? "Token inválido"}`);
    }

    console.log(`[Checkout] Usuário: ${user.email}`);

    // 2. Parse do corpo
    const { itens, freteInfo, couponCode } = await req.json();

    if (!itens || !Array.isArray(itens) || itens.length === 0) {
      return errResponse("ERRO: Carrinho vazio");
    }

    // 2.5 Buscar o endereço selecionado do usuário
    const { data: profile } = await supabase.from('profiles').select('address_json').eq('id', user.id).single();
    const addressData = profile?.address_json;
    const selectedAddress = addressData?.addresses?.find((a: any) => a.id === addressData?.selected_id) 
                            || addressData?.addresses?.[0];

    if (!selectedAddress) {
      return errResponse("ERRO: Nenhum endereço de entrega cadastrado no seu perfil. Por favor, adicione um endereço.");
    }
    if (!selectedAddress.phone) {
      return errResponse("ERRO: O endereço selecionado não tem um telefone cadastrado. O telefone é obrigatório para a entrega Lalamove.");
    }

    // 3. Verifica MERCADOPAGO_ACCESS_TOKEN PRIMEIRO (antes de salvar no banco)
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return errResponse("ERRO CONFIG: MERCADOPAGO_ACCESS_TOKEN não está configurado nos Secrets do Supabase. Vá em Settings > Edge Functions > Secrets.");
    }

    // 4. Calcula prazo e data de coleta
    const prazoEmDiasUteis = calcularPrazoFinal(itens);
    const agora = new Date();
    const dataColeta = adicionarDiasUteis(agora, prazoEmDiasUteis);
    dataColeta.setUTCHours(12, 0, 0, 0);
    const scheduleAtISO = dataColeta.toISOString();

    // 5. Valores do frete
    const precoFrete = freteInfo?.price ? Number(freteInfo.price) : 0;
    const veiculoFrete = freteInfo?.vehicle ?? "Padrão";
    const lalamoveQuotationId = freteInfo?.quotationId ?? null;

    console.log(`[Checkout] Frete: ${veiculoFrete} = R$${precoFrete}`);

    // 6. Salva o pedido no banco
    const totalProdutos = itens.reduce((soma: number, item: { price: number; quantity: number }) =>
      soma + (item.price * item.quantity), 0
    );

    let discountValue = 0;
    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single();
      
      if (!couponError && coupon && coupon.is_active) {
        if (!coupon.usage_limit || coupon.used_count < coupon.usage_limit) {
          if (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) {
            if (coupon.type === 'percentage') {
              discountValue = totalProdutos * (coupon.value / 100);
            } else {
              discountValue = coupon.value;
            }
            if (discountValue > totalProdutos) discountValue = totalProdutos;
            
            // Incrementa o uso do cupom
            await supabase.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);
          }
        }
      }
    }

    const { data: novoPedido, error: dbError } = await supabase
      .from("orders")
      .insert({
        user_id:               user.id,
        items:                 itens,
        total_price:           totalProdutos - discountValue + precoFrete,
        freight_price:         precoFrete,
        status:                "pending",
        status_producao:       "Pendente",
        schedule_at:           scheduleAtISO,
        delivery_address:      selectedAddress, // Endereço completo puxado do perfil do cliente
        prazo_dias_uteis:      prazoEmDiasUteis,
        lalamove_quotation_id: lalamoveQuotationId,
      })
      .select()
      .single();

    if (dbError) {
      return errResponse(`ERRO DB: ${dbError.message} | code: ${dbError.code} | hint: ${dbError.hint} | details: ${dbError.details}`);
    }

    console.log(`[Checkout] Pedido criado: ${novoPedido.id}`);

    // 7. Cria Preferência no Mercado Pago
    const origin = req.headers.get("origin") ?? "https://vilacaesquadrias.com.br";

    let mpItems = itens.map((item: any) => ({
      id: String(item.product_id),
      title: item.name || "Produto Vilaça Esquadrias",
      quantity: Number(item.quantity),
      unit_price: Number(item.price),
      currency_id: "BRL",
    }));

    if (discountValue > 0) {
      const remainingPrice = totalProdutos - discountValue;
      mpItems = [];
      if (remainingPrice > 0) {
        mpItems.push({
          id: "pedido_desconto",
          title: "Pedido com Desconto Aplicado",
          quantity: 1,
          unit_price: Number(remainingPrice.toFixed(2)),
          currency_id: "BRL",
        });
      }
    }

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
      await supabase.from("orders").delete().eq("id", novoPedido.id);
      return errResponse(`ERRO MP (${mpResponse.status}): ${mpData?.message ?? JSON.stringify(mpData)}`);
    }

    console.log(`[Checkout] Preferência MP criada: ${mpData.id}`);

    // 8. Limpa o carrinho
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    // 9. Retorna sucesso
    return new Response(JSON.stringify({
      success: true,
      pedidoId:         novoPedido.id,
      preferenceId:     mpData.id,
      checkoutUrl:      mpData.init_point,
      sandboxUrl:       mpData.sandbox_init_point,
      scheduleAt:       scheduleAtISO,
      prazoEmDiasUteis,
      precoFrete,
    }), { status: 200, headers: CORS_HEADERS });

  } catch (err) {
    return errResponse(`ERRO INESPERADO: ${String(err)}`);
  }
});
