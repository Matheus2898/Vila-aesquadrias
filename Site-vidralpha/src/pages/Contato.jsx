import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'

export default function Contato() {
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', mensagem: '', tipo: 'orcamento' })
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  // Honeypot: campo invisível — se preenchido, é um bot
  const [honeypot, setHoneypot] = useState('')

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async e => {
    e.preventDefault()
    // Rejeita silenciosamente bots que preencheram o campo honeypot
    if (honeypot) {
      setEnviado(true)
      return
    }
    setLoading(true)
    setErro(null)

    const { error } = await supabase.from('contacts').insert([{
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      telefone: form.telefone.trim(),
      mensagem: form.mensagem.trim(),
      tipo: form.tipo
    }])

    if (error) {
      if (error.message?.includes('Muitas solicitações')) {
        setErro('Você já nos enviou algumas mensagens recentemente. Aguarde um momento e tente novamente, ou nos chame diretamente pelo WhatsApp.')
      } else {
        setErro('Erro ao enviar mensagem. Tente novamente ou entre em contato pelo WhatsApp.')
      }
    } else {
      setEnviado(true)
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1.5px solid #E8E8E0',
    background: '#FAFAFA',
    fontSize: '15px',
    color: '#000000',
    outline: 'none',
    fontFamily: 'var(--font-body)',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxSizing: 'border-box',
  }

  const canais = [
    { icon: '📱', titulo: 'WhatsApp', valor: '(11) 93419-4417', sub: 'Seg–Sex, 8h–18h', href: 'https://wa.me/5511934194417' },
    { icon: '✉️', titulo: 'E-mail', valor: 'vilacaesquadrias@gmail.com', sub: 'Resposta em até 24h', href: 'mailto:vilacaesquadrias@gmail.com' },
    { icon: '📍', titulo: 'Endereço', valor: 'Rua das Esquadrias, 500', sub: 'São Paulo, SP – CEP 01310-000', href: '#' },
  ]

  return (
    <div style={{ background: '#ffffff', color: '#333' }}>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--color-navy-900) 0%, var(--color-navy-800) 100%)',
        padding: 'clamp(60px, 12vw, 100px) 0 clamp(40px, 8vw, 80px)', color: 'white', textAlign: 'center',
      }}>
        <div className="container">
          <div style={{ display: 'inline-block', background: 'rgba(233,187,158,0.15)', border: '1px solid rgba(233,187,158,0.3)', borderRadius: '20px', padding: '6px 20px', marginBottom: '24px', fontSize: '13px', color: 'var(--color-amber-500)', fontWeight: 600, letterSpacing: '1px' }}>
            ENTRE EM CONTATO
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 6vw, 52px)',
            fontWeight: 900,
            marginBottom: '16px'
          }}>
            Fale com a gente
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 3vw, 16px)',
            color: 'rgba(255,255,255,0.65)',
            maxWidth: '500px',
            margin: '0 auto'
          }}>
            Solicite um orçamento ou tire suas dúvidas. Nossa equipe retorna em até 24 horas.
          </p>
        </div>
      </section>

      {/* Canais de Atendimento */}
      <section style={{ background: 'var(--color-amber-500)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
          {canais.map((c, i) => (
            <a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" style={{
              flex: '1', minWidth: '240px', padding: 'clamp(24px, 5vw, 32px)', textAlign: 'center',
              textDecoration: 'none', color: 'var(--color-navy-900)',
              borderRight: '1px solid rgba(0,0,0,0.1)',
              transition: 'background 0.2s ease',
            }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(26,30,76,0.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{c.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.titulo}</div>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.valor}</div>
              <div style={{ fontSize: '12px', opacity: 0.65, marginTop: '4px' }}>{c.sub}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Formulário + Info */}
      <section style={{ padding: '80px 0 120px', background: '#ffffff' }}>
        <div className="container contact-form-grid">

          {/* Formulário */}
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, color: '#000000', marginBottom: '8px' }}>
              Solicite um Orçamento
            </h2>
            <p style={{ fontSize: '15px', color: '#555555', marginBottom: '40px' }}>
              Preencha o formulário e retornaremos em até 24h com uma proposta personalizada.
            </p>

            {enviado ? (
              <div style={{
                background: 'var(--gradient-navy)',
                borderRadius: '20px', padding: '48px', textAlign: 'center', color: 'white'
              }}>
                <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '22px', fontWeight: 700, marginBottom: '12px' }}>
                  Mensagem enviada!
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: 1.7 }}>
                  Recebemos sua solicitação e entraremos em contato em breve. Obrigado!
                </p>
                <button onClick={() => { setEnviado(false); setErro(null); setForm({ nome: '', email: '', telefone: '', mensagem: '', tipo: 'orcamento' }) }} style={{
                  marginTop: '24px', background: 'var(--gradient-amber)', color: 'white',
                  padding: '12px 28px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '15px', fontFamily: 'var(--font-body)'
                }}>
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Honeypot anti-bot: campo invisível para humanos */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                  <input tabIndex={-1} name="website" autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
                </div>
                {/* Tipo de contato */}

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#000000', marginBottom: '8px', display: 'block' }}>Motivo do contato</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[{ v: 'orcamento', l: 'Orçamento' }, { v: 'duvida', l: 'Dúvida' }, { v: 'assistencia', l: 'Assistência Técnica' }].map(opt => (
                      <button key={opt.v} type="button" onClick={() => setForm({ ...form, tipo: opt.v })} style={{
                        padding: '8px 18px', borderRadius: '50px', border: '1.5px solid',
                        borderColor: form.tipo === opt.v ? 'var(--color-navy-800)' : '#E8E8E0',
                        background: form.tipo === opt.v ? 'var(--color-navy-800)' : 'transparent',
                        color: form.tipo === opt.v ? 'white' : '#666',
                        fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                        transition: 'all 0.2s ease'
                      }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#000000', marginBottom: '8px', display: 'block' }}>Nome completo *</label>
                    <input required name="nome" value={form.nome} onChange={handleChange} placeholder="Seu nome" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-amber-500)'; e.target.style.boxShadow = 'var(--shadow-sm)' }}
                      onBlur={e => { e.target.style.borderColor = '#E8E8E0'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#000000', marginBottom: '8px', display: 'block' }}>Telefone / WhatsApp *</label>
                    <input required name="telefone" value={form.telefone} onChange={handleChange} placeholder="(11) 93419-4417" style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = 'var(--color-amber-500)'; e.target.style.boxShadow = 'var(--shadow-sm)' }}
                      onBlur={e => { e.target.style.borderColor = '#E8E8E0'; e.target.style.boxShadow = 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#000000', marginBottom: '8px', display: 'block' }}>E-mail *</label>
                  <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="seu@email.com" style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-amber-500)'; e.target.style.boxShadow = 'var(--shadow-sm)' }}
                    onBlur={e => { e.target.style.borderColor = '#E8E8E0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#000000', marginBottom: '8px', display: 'block' }}>Mensagem *</label>
                  <textarea required name="mensagem" value={form.mensagem} onChange={handleChange} rows={5}
                    placeholder="Descreva seu projeto, produto de interesse, dimensões aproximadas…"
                    style={{ ...inputStyle, resize: 'vertical', minHeight: '130px' }}
                    onFocus={e => { e.target.style.borderColor = 'var(--color-amber-500)'; e.target.style.boxShadow = 'var(--shadow-sm)' }}
                    onBlur={e => { e.target.style.borderColor = '#E8E8E0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>

                {erro && (
                  <div style={{
                    padding: '12px 16px', borderRadius: '10px', marginBottom: '8px',
                    background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5',
                    fontSize: '14px', fontWeight: 600
                  }}>{erro}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '16px 32px', borderRadius: '50px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'var(--gradient-amber)', color: 'white',
                    fontWeight: 800, fontSize: '16px', fontFamily: 'var(--font-body)',
                    boxShadow: '0 8px 24px rgba(233,187,158,0.3)', transition: 'transform 0.2s',
                    alignSelf: 'flex-start', opacity: loading ? 0.7 : 1
                  }}
                  onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {loading ? 'Enviando...' : 'Enviar Mensagem →'}
                </button>
              </form>
            )}
          </div>
 
          {/* Info lateral */}
          <div className="contact-info-col" style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'flex-start' }}>
            <div style={{
              background: 'var(--color-navy-900)',
              borderRadius: '20px', padding: '32px', color: 'white'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
                Horário de Atendimento
              </h3>
              {[
                { dia: 'Segunda a Sexta', hora: '08:00 – 18:00' },
                { dia: 'Sábado', hora: '09:00 – 13:00' },
                { dia: 'Domingo', hora: 'Fechado' },
              ].map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>{h.dia}</span>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{h.hora}</span>
                </div>
              ))}
            </div>
 
            <div style={{ background: '#F5F5F0', borderRadius: '20px', padding: '32px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: '#000000', marginBottom: '16px' }}>
                Atendimento Rápido
              </h3>
              <p style={{ fontSize: '14px', color: '#555555', lineHeight: 1.7, marginBottom: '20px' }}>
                Para respostas imediatas, utilize nosso WhatsApp. Nossa equipe responde em minutos durante o horário comercial.
              </p>
              <a href="https://wa.me/5511934194417" target="_blank" rel="noreferrer" style={{
                display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center',
                background: '#25D366', color: 'white', padding: '14px', borderRadius: '14px',
                textDecoration: 'none', fontWeight: 700, fontSize: '15px',
                boxShadow: '0 4px 16px rgba(37,211,102,0.3)', transition: 'transform 0.2s ease'
              }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.473-1.761-1.645-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
                </svg>
                Chamar no WhatsApp
              </a>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
