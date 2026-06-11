// Script de teste para diagnosticar o erro do lalamove-checkout
// Rode com: node test_checkout.mjs

const SUPABASE_URL = "https://nyayegnnjwbdtmvvkhau.supabase.co";
const ANON_KEY = "sb_publishable_QtGRNKXvt5mOGPOSDxjS7g_at1OYRlI";

async function testCheckout() {
  console.log("🔍 Testando lalamove-checkout...\n");

  // Primeiro vamos testar se conseguimos fazer login
  const loginResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      email: "matheus@vilacaesquadrias.com.br", // Troque pelo seu email se necessário
      password: "COLOQUE_SUA_SENHA_AQUI",
    }),
  });

  if (!loginResp.ok) {
    const err = await loginResp.json();
    console.log("❌ Erro de login:", JSON.stringify(err, null, 2));
    console.log("\n⚠️  Edite o arquivo e coloque seu email/senha para testar");
    return;
  }

  const { access_token } = await loginResp.json();
  console.log("✅ Login OK\n");

  // Agora testa o checkout
  const checkoutResp = await fetch(`${SUPABASE_URL}/functions/v1/lalamove-checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${access_token}`,
      "apikey": ANON_KEY,
    },
    body: JSON.stringify({
      itens: [
        {
          product_id: 1,
          name: "Produto Teste",
          price: 100,
          quantity: 1,
          prazo_base: 5,
          dias_extras_por_unidade: 1,
        }
      ],
      enderecoEntrega: {
        lat: "-23.5505",
        lng: "-46.6333",
        address: "CEP 06361400",
        cep: "06361400",
      },
      freteInfo: {
        vehicle: "Carro de Passeio (Até 300kg)",
        price: 45,
        time: "2-3 dias úteis",
        quotationId: null,
      },
    }),
  });

  const data = await checkoutResp.json();
  console.log(`📦 Status HTTP: ${checkoutResp.status}`);
  console.log("📋 Resposta:", JSON.stringify(data, null, 2));
}

testCheckout().catch(console.error);
