import { useState } from 'react'

const faqs = [
  {
    categoria: 'Produtos',
    perguntas: [
      {
        q: 'Quais tipos de vidro vocês utilizam?',
        a: 'Trabalhamos exclusivamente com vidro temperado (6mm, 8mm, 10mm e 12mm) e vidro laminado. Todos certificados pelas normas ABNT NBR 7199 e NBR 7170, garantindo segurança máxima.'
      },
      {
        q: 'As esquadrias são sob medida?',
        a: 'Sim! Todos os nossos produtos são fabricados sob medida, a partir de projetos personalizados. Medimos e adaptamos para cada ambiente, seja residencial ou comercial.'
      },
      {
        q: 'Quais acabamentos de perfil estão disponíveis?',
        a: 'Oferecemos perfis em Preto Fosco, Champagne, Dourado e Branco. Todos em alumínio de alta resistência com tratamento anticorrosão.'
      },
      {
        q: 'Os produtos têm garantia?',
        a: 'Sim. Oferecemos garantia de 5 anos nos perfis e estrutura, e 2 anos nos acessórios e ferragens. O vidro temperado é coberto por garantia vitalícia contra defeitos de fabricação.'
      },
    ]
  },
  {
    categoria: 'Compra e Entrega',
    perguntas: [
      {
        q: 'Qual o prazo de fabricação e entrega?',
        a: 'O prazo médio é de 15 a 30 dias úteis após a confirmação do pedido e visita técnica de medição. Projetos complexos podem ter prazo diferenciado.'
      },
      {
        q: 'Vocês entregam em todo o Brasil?',
        a: 'Atendemos cidades em todo o território nacional. Para cidades a mais de 200km da nossa sede, o frete é calculado separadamente com base no volume e destino.'
      },
      {
        q: 'Como funciona o pagamento?',
        a: 'Aceitamos PIX, boleto bancário e cartão de crédito (parcelamento em até 12x). Normalmente é solicitado 50% no fechamento do pedido e 50% na entrega.'
      },
      {
        q: 'Posso cancelar ou alterar meu pedido?',
        a: 'Alterações são aceitas em até 3 dias úteis após a confirmação do pedido, sem custo adicional. Após esse prazo, mudanças podem gerar custos de reproje​tamento.'
      },
    ]
  },
  {
    categoria: 'Instalação',
    perguntas: [
      {
        q: 'A instalação está incluída?',
        a: 'Sim, a instalação profissional está inclusa em todos os nossos pacotes. Nossa equipe técnica especializada garante o acabamento perfeito e o funcionamento correto de cada peça.'
      },
      {
        q: 'Preciso preparar o ambiente antes da instalação?',
        a: 'Sim. Para portas e janelas pivotantes é necessário que a alvenaria esteja concluída e o acabamento (gesso, reboco) estar pronto. Nossa equipe orienta você durante a visita técnica.'
      },
      {
        q: 'Quanto tempo leva a instalação?',
        a: 'Uma porta pivotante padrão é instalada em 2 a 4 horas. Projetos maiores (como fechamentos de varanda ou corrimões) podem levar 1 a 2 dias.'
      },
    ]
  },
]

function FaqItem({ pergunta, resposta }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div style={{
      borderBottom: '1px solid #E8E8E0',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{
          width: '100%', textAlign: 'left', padding: '24px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px'
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, color: '#1a1e4c', lineHeight: 1.4 }}>
          {pergunta}
        </span>
        <span style={{
          flexShrink: 0, width: '28px', height: '28px', borderRadius: '50%',
          background: aberto ? 'var(--color-amber-500)' : 'rgba(26,30,76,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s ease', transform: aberto ? 'rotate(180deg)' : 'rotate(0deg)',
          fontSize: '16px', color: aberto ? 'var(--color-navy-900)' : 'var(--color-navy-900)'
        }}>
          ↓
        </span>
      </button>
      <div style={{
        maxHeight: aberto ? '400px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <p style={{ padding: '0 0 32px', fontSize: '15px', color: '#444444', lineHeight: 1.8, margin: 0 }}>
          {resposta}
        </p>
      </div>
    </div>
  )
}

export default function FAQ() {
  return (
    <div style={{ background: '#ffffff', color: '#333' }}>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-navy-900) 0%, #2a3080 100%)',
        padding: 'clamp(60px, 12vw, 100px) 0 clamp(40px, 8vw, 80px)', color: 'white', textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'inline-block', background: 'rgba(255,200,50,0.15)', border: '1px solid rgba(255,200,50,0.3)', borderRadius: '20px', padding: '6px 20px', marginBottom: '24px', fontSize: '13px', color: 'var(--color-amber-500)', fontWeight: 600, letterSpacing: '1px' }}>
            TIRE SUAS DÚVIDAS
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(28px, 6vw, 52px)', 
            fontWeight: 900, 
            marginBottom: '16px' 
          }}>
            Perguntas Frequentes
          </h1>
          <p style={{ 
            fontSize: 'clamp(14px, 3vw, 16px)', 
            color: 'rgba(255,255,255,0.65)', 
            maxWidth: '500px', 
            margin: '0 auto' 
          }}>
            Encontre respostas para as dúvidas mais comuns sobre nossos produtos e serviços.
          </p>
        </div>
      </section>

      {/* FAQ por categorias */}
      <section style={{ padding: '80px 0', background: '#ffffff' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          {faqs.map((categoria, ci) => (
            <div key={ci} style={{ marginBottom: '56px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ width: '4px', height: '24px', background: 'var(--color-amber-500)', borderRadius: '2px' }} />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, color: '#1a1e4c' }}>
                  {categoria.categoria}
                </h2>
              </div>
              <div style={{ borderTop: '1px solid #E8E8E0' }}>
                {categoria.perguntas.map((item, qi) => (
                  <FaqItem key={qi} pergunta={item.q} resposta={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Não encontrou? */}
      <section style={{ 
        background: '#1a1e4c', 
        padding: 'clamp(60px, 10vw, 100px) 0', 
        textAlign: 'center' 
      }}>
        <div className="container">
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>💬</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
            Não encontrou sua resposta?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
            Nossa equipe está pronta para te ajudar. Fale com a gente agora mesmo!
          </p>
          <a href="https://wa.me/5511934194417" target="_blank" rel="noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            background: 'var(--gradient-amber)', color: 'var(--color-navy-900)',
            padding: '14px 28px', borderRadius: '50px', fontWeight: 800, fontSize: '15px',
            textDecoration: 'none', boxShadow: 'var(--glow-amber-md)',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Falar via WhatsApp
          </a>
        </div>
      </section>

    </div>
  )
}
