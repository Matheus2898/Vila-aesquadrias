export default function QuemSomos() {
  const valores = [
    { icon: '🏆', titulo: 'Excelência', desc: 'Cada esquadria é fabricada com os mais altos padrões de qualidade e precisão técnica.' },
    { icon: '🔒', titulo: 'Segurança', desc: 'Vidros temperados e perfis reforçados que garantem proteção máxima para sua família.' },
    { icon: '🎨', titulo: 'Design', desc: 'Estética sofisticada que valoriza a arquitetura e eleva o padrão do seu imóvel.' },
    { icon: '🤝', titulo: 'Confiança', desc: 'Mais de 15 anos de experiência e milhares de clientes satisfeitos em todo o Brasil.' },
  ]

  const numeros = [
    { valor: '15+', label: 'Anos no mercado' },
    { valor: '3.000+', label: 'Projetos entregues' },
    { valor: '98%', label: 'Satisfação dos clientes' },
    { valor: '50+', label: 'Cidades atendidas' },
  ]

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>

      {/* Hero da Página */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-navy-900) 0%, var(--color-navy-700) 100%)',
        padding: 'clamp(60px, 12vw, 100px) 0 clamp(40px, 8vw, 80px)',
        color: 'white',
        textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'inline-block', background: 'rgba(255,200,50,0.15)', border: '1px solid rgba(255,200,50,0.3)', borderRadius: '20px', padding: '6px 20px', marginBottom: '24px', fontSize: '13px', color: 'var(--color-amber-500)', fontWeight: 600, letterSpacing: '1px' }}>
            NOSSA HISTÓRIA
          </div>
          <h1 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: 'clamp(28px, 6vw, 60px)', 
            fontWeight: 900, 
            marginBottom: '24px', 
            lineHeight: 1.1 
          }}>
            Transformando espaços com<br />
            <span style={{ color: 'var(--color-amber-500)' }}>vidro e elegância</span>
          </h1>
          <p style={{ 
            fontSize: 'clamp(15px, 3vw, 18px)', 
            color: 'rgba(255,255,255,0.7)', 
            maxWidth: '600px', 
            margin: '0 auto', 
            lineHeight: 1.7 
          }}>
            Desde 2009, a Vilaça Esquadrias e Vidros lidera o mercado de acessórios e esquadrias premium em vidro temperado, 
            unindo tecnologia, design e durabilidade em cada projeto.
          </p>
        </div>
      </section>

      {/* Números */}
      <section style={{ background: 'var(--color-amber-500)', padding: 'clamp(32px, 5vw, 48px) 0' }}>
        <div className="container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: 'clamp(32px, 8vw, 80px)', 
          flexWrap: 'wrap' 
        }}>
          {numeros.map((n, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 5vw, 42px)', fontWeight: 900, color: 'var(--color-navy-900)', lineHeight: 1 }}>{n.valor}</div>
              <div style={{ fontSize: '13px', color: 'var(--color-navy-900)', opacity: 0.7, marginTop: '8px', fontWeight: 600 }}>{n.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Missão */}
      <section style={{ padding: '80px 0', background: 'var(--bg-base)' }}>
        <div className="container ds-two-col" style={{ gap: '40px', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(131,90,70,0.07)', borderRadius: '20px', padding: '6px 20px', marginBottom: '24px', fontSize: '13px', color: 'var(--color-navy-800)', fontWeight: 600, letterSpacing: '1px' }}>
              NOSSA MISSÃO
            </div>
            <h2 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: 'clamp(26px, 5vw, 36px)', 
              fontWeight: 800, 
              color: 'var(--color-navy-800)', 
              marginBottom: '24px', 
              lineHeight: 1.2 
            }}>
              Qualidade que você vê,<br />durabilidade que você sente
            </h2>
            <p style={{ 
              fontSize: 'clamp(14px, 3vw, 16px)', 
              color: '#444444', 
              lineHeight: 1.8, 
              marginBottom: '24px' 
            }}>
              Acreditamos que uma boa esquadria não é apenas funcional — ela define a identidade 
              de um ambiente. Nossos produtos combinam engenharia de ponta com acabamento impecável 
              para oferecer o melhor em cada detalhe.
            </p>
            <p style={{ fontSize: 'clamp(14px, 3vw, 16px)', color: '#444444', lineHeight: 1.8 }}>
              Trabalhamos diretamente com arquitetos, construtoras e clientes finais, oferecendo 
              soluções personalizadas e atendimento especializado do projeto à instalação.
            </p>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-navy-900) 0%, var(--color-navy-700) 100%)',
            borderRadius: '24px',
            padding: '48px',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,200,50,0.1)' }} />
            <div style={{ position: 'absolute', bottom: '-30px', left: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,200,50,0.08)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>🪟</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>Fabricação Própria</h3>
              <p style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: '15px' }}>
                Controlamos todo o processo de produção — desde o corte do vidro temperado 
                até a instalação final — garantindo qualidade em cada etapa.
              </p>
              <div style={{ marginTop: '32px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {['ISO 9001', 'ABNT NBR', 'Vidro Laminado', 'Garantia 5 anos'].map((tag, i) => (
                  <span key={i} style={{ background: 'rgba(255,200,50,0.2)', border: '1px solid rgba(255,200,50,0.3)', borderRadius: '12px', padding: '6px 14px', fontSize: '12px', color: 'var(--color-amber-500)', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section style={{ background: 'var(--bg-overlay)', padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(131,90,70,0.12)', borderRadius: '20px', padding: '6px 20px', marginBottom: '16px', fontSize: '13px', color: 'var(--color-navy-800)', fontWeight: 600, letterSpacing: '1px' }}>
              NOSSOS VALORES
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: 'var(--color-navy-800)' }}>
              O que nos guia
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {valores.map((v, i) => (
              <div key={i} style={{
                background: 'white',
                borderRadius: '20px',
                padding: '36px 28px',
                boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)' }}
              >
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>{v.icon}</div>
                 <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, color: 'var(--color-navy-800)', marginBottom: '12px' }}>{v.titulo}</h3>
                <p style={{ fontSize: '14px', color: '#444444', lineHeight: 1.7 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final — fundo navy, texto branco */}
      <section style={{ background: 'var(--color-navy-900)', padding: '80px 0 120px', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '36px', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
            Vamos transformar seu projeto?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
            Fale com nossos especialistas e descubra a esquadria ideal para o seu espaço.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://wa.me/5511934194417" target="_blank" rel="noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'var(--gradient-amber)', color: 'white',
              padding: '16px 32px', borderRadius: '50px', fontWeight: 800, fontSize: '16px',
              textDecoration: 'none', boxShadow: '0 8px 24px rgba(233,187,158,0.3)',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              💬 Falar no WhatsApp
            </a>
            <a href="/produtos" style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'transparent', color: '#ffffff',
              padding: '16px 32px', borderRadius: '50px', fontWeight: 700, fontSize: '16px',
              textDecoration: 'none', border: '2px solid rgba(255,255,255,0.4)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'white' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
            >
              Ver Catálogo
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
