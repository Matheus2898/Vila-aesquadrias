import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN") ?? "";
const LALAMOVE_API_KEY = Deno.env.get("LALAMOVE_API_KEY") ?? "";
const LALAMOVE_API_SECRET = Deno.env.get("LALAMOVE_API_SECRET") ?? "";
const LALAMOVE_BASE_URL = Deno.env.get("LALAMOVE_BASE_URL") ?? "https://rest.sandbox.lalamove.com";
const LALAMOVE_MARKET = Deno.env.get("LALAMOVE_MARKET") ?? "BR";

// Lalamove Helper functions
async function gerarAssinaturaLalamove(metodo: string, caminho: string, timestamp: string, corpo: string): Promise<string> {
    const mensagemBruta = `${timestamp}\r\n${metodo}\r\n${caminho}\r\n\r\n${corpo}`;
    const chaveSecreta = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(LALAMOVE_API_SECRET),
        { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const assinatura = await crypto.subtle.sign("HMAC", chaveSecreta, new TextEncoder().encode(mensagemBruta));
    return Array.from(new Uint8Array(assinatura)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function requestLalamove(metodo: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", caminho: string, corpo?: object): Promise<{ ok: boolean; data?: unknown; error?: string }> {
    const timestamp = String(Date.now());
    const corpoStr = corpo ? JSON.stringify(corpo) : "";
    const assinatura = await gerarAssinaturaLalamove(metodo, caminho, timestamp, corpoStr);
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
        return { ok: false, error: dados?.message ?? "Erro na Lalamove" };
    }
    return { ok: true, data: dados };
}

serve(async (req: Request) => {
    try {
        const url = new URL(req.url);
        
        // Mercado Pago envia o id no query (data.id) ou no corpo (data.id)
        let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id");
        
        // Se for POST com corpo
        if (req.method === "POST" && !paymentId) {
            const body = await req.json();
            if (body.type === "payment" && body.data && body.data.id) {
                paymentId = body.data.id;
            }
        }

        if (!paymentId) {
            return new Response("Not a payment event", { status: 200 });
        }

        // 1. Consulta o pagamento no Mercado Pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: {
                "Authorization": `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`
            }
        });

        if (!mpResponse.ok) {
            return new Response("Payment not found", { status: 404 });
        }

        const paymentInfo = await mpResponse.json();
        const orderId = paymentInfo.external_reference;
        const status = paymentInfo.status; // 'approved', 'pending', 'rejected'

        if (!orderId) {
            return new Response("Missing external_reference", { status: 200 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Busca o pedido no banco
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return new Response("Order not found", { status: 200 });
        }

        // Se já foi processado ou confirmado, ignora
        if (order.status !== "pending_payment") {
            return new Response("Order already processed", { status: 200 });
        }

        if (status === "approved") {
            // 2. Atualiza o status do pedido para confirmado
            await supabase.from("orders").update({ status: "confirmed" }).eq("id", orderId);

            // 3. Dispara o pedido na Lalamove (Place Order)
            if (order.lalamove_quotation_id && !order.lalamove_order_id) {
                
                // Precisamos buscar os dados do usuário para preencher o recipient
                const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
                
                const payloadPedido = {
                    data: {
                        quotationId: order.lalamove_quotation_id,
                        sender: {
                            stopIndex: "0",
                            name: "Vidralpha Fábrica",
                            phone: Deno.env.get("LALAMOVE_SENDER_PHONE") ?? "+5511999999999",
                        },
                        recipients: [
                            {
                                stopIndex: "1",
                                name: userData?.user?.user_metadata?.full_name || "Cliente",
                                phone: order.delivery_address?.phone ?? "+5511999999999",
                            },
                        ],
                        isRecipientSMSEnabled: true,
                        isPODEnabled: false,
                        item: {
                            quantity: "1",
                            weight: "LESS_THAN_3KG",
                            categories: ["WINDOW"]
                        },
                        metadata: {
                            orderId: orderId,
                        },
                    },
                };

                const resultPedido = await requestLalamove("POST", "/v3/orders", payloadPedido);
                
                if (resultPedido.ok) {
                    const lalamoveData = resultPedido.data as any;
                    const lalamoveOrderId = lalamoveData?.data?.orderId;
                    const shareLink = lalamoveData?.data?.shareLink;

                    // Salva o ID da entrega no pedido
                    await supabase.from("orders").update({
                        lalamove_order_id: lalamoveOrderId,
                        lalamove_share_link: shareLink
                    }).eq("id", orderId);
                    
                    console.log(`[Webhook] Pagamento aprovado! Pedido ${orderId} atualizado. Lalamove ID: ${lalamoveOrderId}`);
                } else {
                    console.error("[Webhook] Erro ao criar pedido na Lalamove:", resultPedido.error);
                }
            }

            return new Response("OK", { status: 200 });
        } else if (status === "rejected" || status === "cancelled") {
            await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId);
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook error:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
});
