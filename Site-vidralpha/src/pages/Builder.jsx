import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Builder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: Category, 2: Details/Complex, 3: Success
  const [category, setCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [isComplex, setIsComplex] = useState(false)

  const handleCreateQuote = async () => {
    if (!projectName) {
      toast.error('Dê um nome ao seu projeto!')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('quotes')
        .insert({
          client_id: user.id,
          project_name: projectName,
          description: `Categoria: ${category}`,
          complex_request: isComplex,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      setStep(3)
    } catch (err) {
      toast.error('Erro ao criar orçamento: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 3) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
        <CheckCircle2 size={80} color="#15803D" style={{ marginBottom: '24px' }} />
        <h1 className="t-h1" style={{ fontSize: '32px', marginBottom: '16px' }}>Orçamento Enviado!</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>Seu pedido foi recebido com sucesso. Nossa equipe analisará os detalhes e você poderá acompanhar o status no seu painel.</p>
        <button onClick={() => navigate('/app')} className="btn-ds btn-primary btn-round" style={{ padding: '16px 40px' }}>Ir para o Painel</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '80px 24px' }}>
      {step === 1 && (
        <>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="badge-amber" style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '999px', background: 'rgba(255,214,0,0.15)', color: '#92400E', fontSize: '12px', fontWeight: 700, marginBottom: '16px' }}>PASSO 1 DE 2</span>
            <h1 className="t-h1" style={{ fontSize: '36px', marginBottom: '8px' }}>O que você precisa?</h1>
            <p style={{ color: '#666' }}>Selecione a categoria da esquadria para iniciarmos as configurações.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
            {[
              { id: 'box', label: 'Box de Banheiro', icon: '🚿', desc: 'Frontal, Canto ou Open' },
              { id: 'fachada', label: 'Fachada Muro/Vidro', icon: '🪟', desc: 'Vidros externos e guarda-corpo' },
              { id: 'espelho', label: 'Espelhos', icon: '🪞', desc: 'Lapidado, Bisotê e LED' }
            ].map(item => (
              <div
                key={item.id}
                onClick={() => { setCategory(item.label); setStep(2); }}
                className="card-ds"
                style={{
                  textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', paddingBottom: '24px',
                  border: category === item.label ? '2px solid var(--color-navy-700)' : '1px solid #E8E8E0'
                }}>
                <div className="card-ds-image" style={{ height: '140px', fontSize: '48px' }}>{item.icon}</div>
                <h3 className="t-h2" style={{ fontSize: '18px', marginTop: '20px' }}>{item.label}</h3>
                <p style={{ fontSize: '13px', color: '#888', marginTop: '8px', padding: '0 16px' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {step === 2 && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', marginBottom: '24px', fontSize: '14px' }}>← Voltar</button>
          <div style={{ marginBottom: '32px' }}>
            <h2 className="t-h1" style={{ fontSize: '28px', marginBottom: '8px' }}>Detalhes do Projeto</h2>
            <p style={{ color: '#666' }}>Defina um nome e nos diga se você possui as medidas ou se é um projeto complexo.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>Nome do Projeto (Ex: Residência Silva)</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Reforma Cozinha"
                style={{ padding: '14px', borderRadius: '8px', border: '1px solid #DDD', outline: 'none' }}
              />
            </div>

            <div
              onClick={() => setIsComplex(!isComplex)}
              style={{
                padding: '20px', borderRadius: '12px', border: '1px solid',
                borderColor: isComplex ? 'var(--color-navy-700)' : '#EEE',
                background: isComplex ? 'rgba(26, 30, 76, 0.02)' : 'white',
                cursor: 'pointer', display: 'flex', gap: '16px', alignItems: 'center'
              }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '6px', border: '2px solid',
                borderColor: isComplex ? 'var(--color-navy-700)' : '#DDD',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isComplex ? 'var(--color-navy-700)' : 'transparent'
              }}>
                {isComplex && <div style={{ width: '10px', height: '10px', background: 'white', borderRadius: '2px' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '15px' }}>Projeto Complexo / Não tenho medidas</strong>
                <span style={{ fontSize: '13px', color: '#888' }}>Desejo anexar a planta/PDF da obra para análise técnica.</span>
              </div>
            </div>

            <button
              onClick={handleCreateQuote}
              disabled={loading}
              className="btn-ds btn-primary btn-round"
              style={{ marginTop: '16px', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Enviar Orçamento <ArrowRight size={20} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
