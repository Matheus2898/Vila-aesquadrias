// ============================================================================
// Edge Function: lalamove-quote
// Responsabilidade: Recebe o CEP destino e peso, calcula cotação de frete.
// Tenta via API Lalamove; caso não configurada, retorna preços fixos por peso.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const LALAMOVE_API_KEY    = Deno.env.get("LALAMOVE_API_KEY") ?? "";
const LALAMOVE_API_SECRET = Deno.env.get("LALAMOVE_API_SECRET") ?? "";
const LALAMOVE_BASE_URL   = Deno.env.get("LALAMOVE_BASE_URL") ?? "https://rest.sandbox.lalamove.com";
const LALAMOVE_MARKET     = Deno.env.get("LALAMOVE_MARKET") ?? "BR";

// Coordenadas da fábrica Vidralpha (origem fixa)
const ORIGEM_LAT = Deno.env.get("FABRICA_LAT") ?? "-23.5505";
const ORIGEM_LNG = Deno.env.get("FABRICA_LNG") ?? "-46.6333";
const ORIGEM_ADDR = Deno.env.get("FABRICA_ADDRESS") ?? "Vidralpha Esquadrias, São Paulo, SP";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

// ─── Helper: Converte CEP em coordenadas via ViaCEP + Nominatim ─────────────
async function cepParaCoordenadas(cep: string): Promise<{ lat: string; lng: string; address: string } | null> {
  try {
    // 1. Busca endereço via ViaCEP
    const viaCepResp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!viaCepResp.ok) return null;
    const viaCepData = await viaCepResp.json();
    if (viaCepData.erro) return null;

    const enderecoCompleto = `${viaCepData.logradouro || ''}, ${viaCepData.bairro || ''}, ${viaCepData.localidade || ''}, ${viaCepData.uf || ''}, Brasil`;

    // 2. Geocodifica via Nominatim (OpenStreetMap)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1`;
    const nominatimResp = await fetch(nominatimUrl, {
      headers: { "User-Agent": "Vidralpha/1.0" }
    });
    if (!nominatimResp.ok) return null;
    const nominatimData = await nominatimResp.json();
    if (!nominatimData || nominatimData.length === 0) return null;

    return {
      lat: nominatimData[0].lat,
      lng: nominatimData[0].lon,
      address: enderecoCompleto,
    };
  } catch {
    return null;
  }
}

// ─── Helper: Assinatura HMAC-SHA256 para Lalamove API v3 ─────────────────────
async function gerarAssinatura(metodo: string, caminho: string, timestamp: string, corpo: string): Promise<string> {
  const msg = `${timestamp}\r\n${metodo}\r\n${caminho}\r\n\r\n${corpo}`;
  const chave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(LALAMOVE_API_SECRET),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", chave, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ─── Tabela de fallback: preços fixos por faixa de peso (sem Lalamove) ───────
function calcularPrecosFallback(pesoKg: number): Array<{ vehicle: string; price: number; time: string }> {
  // Preços aproximados para janelas/esquadrias entregues por transportadora parceira
  let precoCarro = 0;
  let precoVan = 0;

  if (pesoKg <= 5) {
    precoCarro = 45.00; precoVan = 80.00;
  } else if (pesoKg <= 15) {
    precoCarro = 75.00; precoVan = 120.00;
  } else if (pesoKg <= 30) {
    precoCarro = 110.00; precoVan = 160.00;
  } else if (pesoKg <= 60) {
    precoCarro = 160.00; precoVan = 220.00;
  } else {
    precoCarro = 220.00; precoVan = 320.00;
  }

  return [
    { vehicle: "Carro de Passeio (Até 300kg)", price: precoCarro, time: "2-3 dias úteis" },
    { vehicle: "Van Utilitária", price: precoVan, time: "1-2 dias úteis" },
  ];
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { destinationCep, weight } = await req.json();

    if (!destinationCep || destinationCep.length !== 8) {
      return new Response(JSON.stringify({ error: "CEP inválido" }), {
        status: 400, headers: CORS_HEADERS,
      });
    }

    const pesoKg = Number(weight) || 1;

    // ── Se não tiver chaves da Lalamove, usa fallback imediamente ──────────
    if (!LALAMOVE_API_KEY || !LALAMOVE_API_SECRET) {
      console.log("[lalamove-quote] Sem chaves Lalamove → usando preços fallback");
      const quotes = calcularPrecosFallback(pesoKg);
      return new Response(JSON.stringify({ quotes, source: "fallback" }), {
        status: 200, headers: CORS_HEADERS,
      });
    }

    // ── Tenta geocodificar o CEP destino ──────────────────────────────────
    const destino = await cepParaCoordenadas(destinationCep);

    if (!destino) {
      console.warn("[lalamove-quote] Geocodificação falhou → usando fallback");
      const quotes = calcularPrecosFallback(pesoKg);
      return new Response(JSON.stringify({ quotes, source: "fallback_geo" }), {
        status: 200, headers: CORS_HEADERS,
      });
    }

    // ── Tenta cotação na API Lalamove ─────────────────────────────────────
    const serviceTypes = ["MOTORCYCLE", "CAR", "VAN"];
    const quotes: Array<{ vehicle: string; price: number | string; time: string }> = [];

    for (const service of serviceTypes) {
      try {
        const timestamp = String(Date.now());
        const caminho = "/v3/quotations";
        const payload = {
          data: {
            serviceType: service,
            language: "pt_BR",
            stops: [
              { coordinates: { lat: ORIGEM_LAT, lng: ORIGEM_LNG }, address: ORIGEM_ADDR },
              { coordinates: { lat: destino.lat, lng: destino.lng }, address: destino.address },
            ],
            scheduleAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            item: { quantity: "1", weight: pesoKg <= 3 ? "LESS_THAN_3KG" : pesoKg <= 10 ? "LESS_THAN_10KG" : "LESS_THAN_30KG" },
          },
        };
        const corpoStr = JSON.stringify(payload);
        const assinatura = await gerarAssinatura("POST", caminho, timestamp, corpoStr);
        const token = `${LALAMOVE_API_KEY}:${timestamp}:${assinatura}`;

        const resp = await fetch(`${LALAMOVE_BASE_URL}${caminho}`, {
          method: "POST",
          headers: {
            "Authorization": `hmac ${token}`,
            "Content-Type": "application/json",
            "Market": LALAMOVE_MARKET,
            "Request-ID": crypto.randomUUID(),
          },
          body: corpoStr,
        });

        if (resp.ok) {
          const dados = await resp.json() as { data?: { priceBreakdown?: { total?: string }; quotationId?: string } };
          const preco = parseFloat(dados?.data?.priceBreakdown?.total ?? "0");
          const quotationId = dados?.data?.quotationId;
          const labels: Record<string, { vehicle: string; time: string }> = {
            MOTORCYCLE: { vehicle: "Moto", time: "Mesmo dia" },
            CAR: { vehicle: "Carro de Passeio (Até 300kg)", time: "2-3 dias úteis" },
            VAN: { vehicle: "Van Utilitária", time: "1-2 dias úteis" },
          };
          if (preco > 0) {
            quotes.push({ vehicle: labels[service].vehicle, price: preco, time: labels[service].time, quotationId });
          }
        } else {
          console.warn(`[lalamove-quote] ${service} falhou → pulando`);
        }
      } catch (e) {
        console.warn(`[lalamove-quote] Erro em ${service}:`, e);
      }
    }

    // Se Lalamove não retornou nenhum resultado, usa fallback
    if (quotes.length === 0) {
      const fallback = calcularPrecosFallback(pesoKg);
      return new Response(JSON.stringify({ quotes: fallback, source: "fallback_api" }), {
        status: 200, headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ quotes, source: "lalamove" }), {
      status: 200, headers: CORS_HEADERS,
    });

  } catch (err) {
    console.error("[lalamove-quote] Erro inesperado:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: CORS_HEADERS,
    });
  }
});
