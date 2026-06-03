import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { Loader2, User, MapPin, Package, LogOut, CheckCircle, Settings, Clock, Hammer, CircleCheck, Truck, CalendarClock, ShoppingCart, Trash2, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import CustomDropdown from '../components/CustomDropdown'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('hub')

  const scrollToContent = useCallback(() => {
    if (window.innerWidth <= 768) {
      const performScroll = () => {
        const element = document.getElementById('profile-content-area')
        if (element) {
          const rect = element.getBoundingClientRect()
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop
          const targetY = rect.top + scrollTop - 100
          window.scrollTo({ top: targetY, behavior: 'smooth' })
        }
      }

      // Tenta imediatamente e novamente após um delay maior para garantir
      // que o elemento já expandiu com o novo conteúdo da aba
      performScroll()
      setTimeout(performScroll, 100)
      setTimeout(performScroll, 300)
    }
  }, [])

  useEffect(() => {
    if (activeTab !== 'hub') {
      scrollToContent()
    }
  }, [activeTab, scrollToContent])
  // 'hub', 'details', 'address', 'orders', 'purchases'

  // Perfil / Detalhes da conta
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Endereços (lista com seleção)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [newAddress, setNewAddress] = useState({
    type: 'residencial', cpf: '', cep: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: '', phone: ''
  })

  // Meus Pedidos
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const [message, setMessage] = useState(null)

  useEffect(() => {
    const initProfile = async () => {
      if (profile || user) {
        const fullNameStr = profile?.full_name || profile?.name || user?.user_metadata?.full_name || ''
        const names = fullNameStr.split(' ')
        setFirstName(names[0] || '')
        setLastName(names.slice(1).join(' ') || '')
        setEmail(user?.email || '')

        if (profile?.address_json) {
          const data = profile.address_json
          if (Array.isArray(data.addresses) && data.addresses.length > 0) {
            setAddresses(data.addresses)
            setSelectedAddressId(data.selected_id || data.addresses[0]?.id || null)
          } else if (data.billing) {
            // Formato antigo — converter para novo
            const addr = { ...data.billing, id: crypto.randomUUID() }
            setAddresses([addr])
            setSelectedAddressId(addr.id)
          }
        }
      }
    }
    initProfile()
  }, [profile, user])

  const fetchOrders = useCallback(async () => {
    if (!user) return
    setOrdersLoading(true)
    try {
      let { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error?.code === '42P01') {
        const fb = await supabase.from('quotes').select('*').order('created_at', { ascending: false })
        data = (fb.data || []).map(q => ({
          ...q,
          status_producao: q.status === 'approved' ? 'Concluída' : (q.status === 'analyzing' ? 'Em Produção' : 'Pendente')
        }))
      }
      setOrders(data || [])
    } catch (err) { console.error(err) }
    finally { setOrdersLoading(false) }
  }, [user])

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders()
  }, [activeTab, fetchOrders])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // 1. Atualizar nome
    const full_name = `${firstName} ${lastName}`.trim()
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (profileError) {
      setMessage({ type: 'error', text: 'Erro ao atualizar nome: ' + profileError.message })
      setLoading(false)
      return
    }

    // 2. Trocar senha (somente se o usuário preencheu os campos)
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' })
        setLoading(false)
        return
      }
      if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
        setLoading(false)
        return
      }

      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })

      if (passwordError) {
        setMessage({ type: 'error', text: 'Erro ao trocar senha: ' + passwordError.message })
        setLoading(false)
        return
      }

      // Limpar campos de senha após troca bem-sucedida
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setMessage({ type: 'success', text: newPassword ? 'Nome e senha atualizados com sucesso!' : 'Dados atualizados com sucesso!' })
    setLoading(false)
  }

  const handleSaveAddress = async () => {
    if (!newAddress.cep || !newAddress.street || !newAddress.city || !newAddress.state) {
      setMessage({ type: 'error', text: 'Preencha os campos obrigatórios: CEP, Endereço, Cidade e Estado.' })
      return
    }
    setLoading(true)
    setMessage(null)

    let updatedAddresses;
    let newSelectedId = selectedAddressId;
    
    if (editingAddressId) {
      updatedAddresses = addresses.map(a => a.id === editingAddressId ? { ...newAddress, id: editingAddressId } : a)
    } else {
      const addr = { ...newAddress, id: crypto.randomUUID() }
      updatedAddresses = [...addresses, addr]
      newSelectedId = selectedAddressId || addr.id
    }

    const address_json = { addresses: updatedAddresses, selected_id: newSelectedId }

    const { error } = await supabase.from('profiles')
      .update({ address_json, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Erro ao salvar endereço: ' + error.message })
    } else {
      setAddresses(updatedAddresses)
      setSelectedAddressId(newSelectedId)
      setShowAddressForm(false)
      setEditingAddressId(null)
      setNewAddress({ type: 'residencial', cpf: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', phone: '' })
      setMessage({ type: 'success', text: 'Endereço salvo com sucesso!' })
    }
    setLoading(false)
  }

  const handleEditAddress = (addr) => {
    setNewAddress(addr)
    setEditingAddressId(addr.id)
    setShowAddressForm(true)
  }

  const handleSelectAddress = async (id) => {
    setSelectedAddressId(id)
    const address_json = { addresses, selected_id: id }
    await supabase.from('profiles')
      .update({ address_json, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    setMessage({ type: 'success', text: 'Endereço de entrega atualizado!' })
  }

  const handleDeleteAddress = async (id) => {
    const updatedAddresses = addresses.filter(a => a.id !== id)
    const newSelectedId = selectedAddressId === id
      ? (updatedAddresses[0]?.id || null)
      : selectedAddressId
    const address_json = { addresses: updatedAddresses, selected_id: newSelectedId }
    const { error } = await supabase.from('profiles')
      .update({ address_json, updated_at: new Date().toISOString() })
      .eq('id', user.id)
    if (!error) {
      setAddresses(updatedAddresses)
      setSelectedAddressId(newSelectedId)
      setMessage({ type: 'success', text: 'Endereço removido com sucesso!' })
    }
  }

  const renderHub = () => (
    <div className="profile-hub-grid">
      {[
        ...((profile?.role === 'admin' || user?.user_metadata?.role === 'admin' || user?.email === 'matheusmatos2898@gmail.com') ? [{ id: 'admin', label: 'Painel Admin', icon: <Settings size={22} /> }] : []),
        { id: 'cart', label: 'Meu Carrinho', icon: <ShoppingCart size={22} /> },
        { id: 'orders', label: 'Meus Pedidos', icon: <Package size={22} /> },
        { id: 'address', label: 'Endereços', icon: <MapPin size={22} /> },
        { id: 'details', label: 'Dados', icon: <User size={22} /> },
        { id: 'logout', label: 'Sair', icon: <LogOut size={22} /> }
      ].map(card => (
        <button
          key={card.id}
          onClick={() => {
            if (card.id === 'logout') {
              signOut()
            } else if (card.id === 'admin') {
              window.location.href = '/admin'
            } else if (card.id === 'cart') {
              window.location.href = '/carrinho'
            } else {
              if (activeTab === card.id && window.innerWidth <= 768) {
                scrollToContent()
              }
              setActiveTab(card.id)
            }
          }}
          className={`hub-card ${activeTab === card.id ? 'active' : ''}`}
        >
          <div className="hub-card-icon">
            {card.icon}
          </div>
          <span className="hub-card-label">{card.label}</span>
        </button>
      ))}
    </div>
  )

  const renderDetails = () => (
    <div className="profile-form-card" style={{ padding: 'clamp(20px, 5vw, 40px)', background: 'white', borderRadius: '16px', border: '1px solid #E8E8E0' }}>
      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '32px', borderBottom: '1px solid #F5F5F0', paddingBottom: '16px' }}>Detalhes da Conta</h3>
      <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="ds-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700 }}>Nome *</label>
            <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAF8', outline: 'none' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700 }}>Sobrenome *</label>
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#FAFAF8', outline: 'none' }} />
          </div>
        </div>

        <div className="profile-form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700 }}>E-mail *</label>
          <div className="profile-email-readonly" style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F3F4F6', color: '#6B7280', fontSize: '15px' }}>
            {email}
          </div>
        </div>

        <div className="profile-security-block" style={{ marginTop: '12px', padding: 'clamp(16px, 4vw, 32px)', border: '1px solid #E8E8E0', borderRadius: '12px', background: '#FAFAF8' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Segurança</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>Senha Atual (deixe em branco para não alterar)</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white' }} />
            </div>
            <div className="ds-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Nova Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Confirmar Nova Senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white' }} />
              </div>
            </div>
          </div>
        </div>

        <button disabled={loading} type="submit" className="btn-ds btn-primary btn-round" style={{ padding: '14px 48px', alignSelf: 'flex-start', width: 'fit-content' }}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Alterações'}
        </button>
      </form>
    </div>
  )



  const renderOrders = () => {
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '—'

    const steps = [
      { key: 'Pendente', label: 'Recebido', icon: <Package size={13} /> },
      { key: 'Em Produção', label: 'Em Produção', icon: <Hammer size={13} /> },
      { key: 'Concluída', label: 'Pronto', icon: <Truck size={13} /> },
    ]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-navy-900)' }}>Meus Pedidos</h2>
          <button onClick={fetchOrders} style={{ background: 'none', border: 'none', color: 'var(--color-navy-700)', fontWeight: 600, cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {ordersLoading ? <Loader2 className="animate-spin" size={14} /> : '↺'} Atualizar
          </button>
        </div>

        {ordersLoading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: '#94A3B8' }} /></div>
        ) : orders.length === 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8E8E0', padding: '60px 32px', textAlign: 'center' }}>
            <Package size={40} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <p style={{ fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Nenhum pedido ainda.</p>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '24px' }}>Quando você realizar uma compra, ela aparecerá aqui.</p>
            <Link to="/produtos" className="btn-ds btn-primary btn-round" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>Ver Catálogo</Link>
          </div>
        ) : (
          orders.map(order => {
            const status = order.status_producao || 'Pendente'
            const activeIdx = steps.findIndex(s => s.key === status)
            const cur = activeIdx === -1 ? 0 : activeIdx
            return (
              <div key={order.id} style={{ background: 'white', borderRadius: '16px', border: '1px solid #E8EEF4', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'monospace', background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>#{String(order.id).slice(-6).toUpperCase()}</span>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formatDate(order.created_at)}</span>
                </div>

                {/* Timeline */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                  {steps.map((step, i) => (
                    <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '60px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i <= cur ? (i === cur ? 'var(--color-navy-900)' : '#ECFDF5') : '#F1F5F9', border: `2px solid ${i <= cur ? (i === cur ? 'var(--color-navy-900)' : '#A7F3D0') : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i <= cur ? (i === cur ? 'white' : '#15803D') : '#94A3B8' }}>
                          {step.icon}
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: i <= cur ? 700 : 500, color: i <= cur ? (i === cur ? 'var(--color-navy-900)' : '#15803D') : '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap' }}>{step.label}</span>
                      </div>
                      {i < steps.length - 1 && <div style={{ flex: 1, height: '2px', margin: '-14px 3px 0', background: i < cur ? '#A7F3D0' : '#E2E8F0' }} />}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                  {order.schedule_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748B' }}>
                      <CalendarClock size={13} /> Coleta: <strong>{formatDate(order.schedule_at)}</strong>
                    </div>
                  )}
                  {order.total_price != null && (
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>R$ {Number(order.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <div className="profile-page-container" style={{ fontFamily: 'var(--font-display)', background: '#FAFAF8', minHeight: '100vh' }}>
      {/* Blue Header Banner */}
      <div className="profile-banner" style={{ background: 'var(--color-navy-900)', padding: 'clamp(60px, 15vw, 120px) 0 80px', color: 'white' }}>
        <div className="container-ds" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 900, marginBottom: '8px', color: 'white' }}>Minha Conta</h1>
          <p style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: 'rgba(255,255,255,0.7)' }}>Olá <span style={{ color: 'var(--color-amber-400)', fontWeight: 700 }}>{firstName || user?.user_metadata?.full_name?.split(' ')[0] || 'Cliente'}</span>, tudo bem?</p>
        </div>
      </div>

      <div className="container-ds" style={{ maxWidth: '1200px', margin: '-40px auto 0', padding: window.innerWidth <= 768 ? '0 10px 60px' : '0 20px 60px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {renderHub()}

        <div id="profile-content-area">
          {message && (
            <div style={{
              padding: '16px 24px', borderRadius: '12px', marginBottom: '32px',
              background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: message.type === 'success' ? '#15803D' : '#B91C1C',
              border: '1px solid currentColor', display: 'flex', alignItems: 'center', gap: '12px',
              fontSize: '14px', fontWeight: 600
            }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <Loader2 className="animate-spin" size={18} />}
              {message.text}
            </div>
          )}

          <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
            {activeTab === 'hub' && <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: 'white', borderRadius: '16px', border: '1px solid #E8E8E0' }}>Selecione uma opção acima para gerenciar sua conta.</div>}
            {activeTab === 'details' && renderDetails()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'purchases' && <div style={{ textAlign: 'center', padding: '60px', color: '#888', background: 'white', borderRadius: '16px', border: '1px solid #E8E8E0', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}><ShoppingCart size={48} opacity={0.3} /> Em breve: Histórico de produtos comprados.</div>}

            {activeTab === 'address' && (
              <div className="profile-form-card" style={{ padding: 'clamp(20px, 5vw, 40px)', background: 'white', borderRadius: '16px', border: '1px solid #E8E8E0' }}>
                <div className="address-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #F5F5F0', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Meus Endereços</h3>
                  {!showAddressForm && (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="btn-ds btn-primary btn-round address-add-btn"
                      style={{ padding: '10px 20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      + Adicionar Endereço
                    </button>
                  )}
                </div>

                {addresses.length === 0 && !showAddressForm && (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94A3B8' }}>
                    <MapPin size={44} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.4 }} />
                    <p style={{ fontWeight: 700, color: '#475569', marginBottom: '8px', fontSize: '16px' }}>Nenhum endereço cadastrado</p>
                    <p style={{ fontSize: '14px', marginBottom: '28px' }}>Adicione um endereço para facilitar seus pedidos.</p>
                    <button onClick={() => setShowAddressForm(true)} className="btn-ds btn-primary btn-round" style={{ padding: '14px 32px' }}>
                      Adicionar meu primeiro endereço
                    </button>
                  </div>
                )}

                {addresses.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: showAddressForm ? '28px' : '0' }}>
                    {addresses.map(addr => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr.id)}
                        style={{
                          border: `2px solid ${selectedAddressId === addr.id ? 'var(--color-navy-700)' : '#E5E7EB'}`,
                          borderRadius: '14px', padding: '20px 24px', cursor: 'pointer',
                          background: selectedAddressId === addr.id ? 'rgba(30,41,59,0.04)' : 'white',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div className="address-card-content" style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${selectedAddressId === addr.id ? 'var(--color-navy-700)' : '#CBD5E1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '3px', transition: 'all 0.2s' }}>
                            {selectedAddressId === addr.id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-navy-700)' }} />}
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div className="address-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: '15px', color: '#1E293B', textTransform: 'capitalize' }}>{addr.type || 'Endereço'}</span>
                                {selectedAddressId === addr.id && (
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-navy-700)', background: '#EEF2FF', padding: '3px 10px', borderRadius: '99px' }}>
                                    ✓ Usado na entrega
                                  </span>
                                )}
                              </div>
                              <div className="address-action-buttons" style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditAddress(addr) }}
                                  style={{ background: 'none', border: '1px solid #E2E8F0', color: '#64748B', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                                >
                                  <Pencil size={12} /> Editar
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id) }}
                                  style={{ background: 'none', border: '1px solid #FCA5A5', color: '#EF4444', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                                >
                                  <Trash2 size={12} /> Remover
                                </button>
                              </div>
                            </div>
                            <div style={{ fontSize: '14px', color: '#475569' }}>
                              Rua {addr.street}{addr.number ? `, ${addr.number}` : ''}{addr.complement ? ` — ${addr.complement}` : ''}
                            </div>
                            <div style={{ fontSize: '14px', color: '#64748B' }}>
                              {addr.neighborhood ? `Bairro ${addr.neighborhood}, ` : ''}{addr.city} — {addr.state}{addr.cep ? ` | CEP ${addr.cep}` : ''}
                            </div>
                            {addr.phone && <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '6px' }}>📞 {addr.phone}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showAddressForm && (
                  <div style={{ border: '1px solid #E5E7EB', borderRadius: '14px', padding: 'clamp(20px, 4vw, 32px)', background: '#FAFAF8' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px', color: 'var(--color-navy-900)' }}>{editingAddressId ? 'Editar Endereço' : 'Novo Endereço'}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="ds-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Tipo</label>
                          <CustomDropdown
                            value={newAddress.type}
                            onChange={val => setNewAddress({ ...newAddress, type: val })}
                            options={[
                              { value: 'residencial', label: 'Residencial' },
                              { value: 'comercial', label: 'Comercial' },
                              { value: 'outros', label: 'Outros' }
                            ]}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>CPF / CNPJ</label>
                          <input type="text" value={newAddress.cpf} onChange={e => setNewAddress({ ...newAddress, cpf: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                      </div>

                      <div className="ds-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>CEP *</label>
                          <input type="text" value={newAddress.cep} onChange={e => setNewAddress({ ...newAddress, cep: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Telefone</label>
                          <input type="text" value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                      </div>

                      <div className="ds-two-col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Rua *</label>
                          <input type="text" value={newAddress.street} onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Número *</label>
                          <input type="text" value={newAddress.number} onChange={e => setNewAddress({ ...newAddress, number: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                      </div>

                      <div className="ds-three-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Bairro *</label>
                          <input type="text" value={newAddress.neighborhood} onChange={e => setNewAddress({ ...newAddress, neighborhood: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Cidade *</label>
                          <input type="text" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Estado *</label>
                          <input type="text" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 700, color: '#444' }}>Complemento (opcional)</label>
                        <input type="text" value={newAddress.complement} onChange={e => setNewAddress({ ...newAddress, complement: e.target.value })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', background: 'white', width: '100%' }} />
                      </div>

                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                          disabled={loading}
                          onClick={handleSaveAddress}
                          className="btn-ds btn-primary btn-round"
                          style={{ padding: '14px 32px' }}
                        >
                          {loading ? <Loader2 className="animate-spin" size={18} /> : (editingAddressId ? 'Atualizar Endereço' : 'Salvar Endereço')}
                        </button>
                        <button
                          onClick={() => { setShowAddressForm(false); setEditingAddressId(null); setNewAddress({ type: 'residencial', cpf: '', cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '', phone: '' }) }}
                          style={{ padding: '14px 32px', borderRadius: '99px', border: '1px solid #E5E7EB', background: 'white', color: '#64748B', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .profile-hub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-top: 40px;
        }

        .hub-card {
          background: white;
          border: 1px solid #E8E8E0;
          border-radius: 16px;
          padding: 32px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
          width: 100%;
          text-align: center;
        }

        .hub-card:hover {
          border-color: var(--color-navy-700);
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }

        .hub-card.active {
          border-color: var(--color-navy-700);
          background: linear-gradient(145deg, #ffffff, #f0f0f0);
          box-shadow: 0 12px 24px rgba(30, 36, 160, 0.1);
        }

        .hub-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #F5F5F0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-navy-900);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .hub-card.active .hub-card-icon {
          background: var(--color-navy-900);
          color: white;
        }

        .hub-card-label {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-navy-900);
        }

        @media (max-width: 768px) {
          .layout-public .main-content {
            padding-top: 114px !important;
          }
        }

        @media (max-width: 768px) {
          .profile-hub-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .hub-card {
            padding: 24px 12px;
            border-radius: 14px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.04);
          }

          .hub-card:active {
            transform: scale(0.96);
          }

          .hub-card-icon {
            width: 40px;
            height: 40px;
          }

          .hub-card-label {
            font-size: 13px;
          }

          .profile-form-card {
            padding: 24px 16px !important;
            width: 100% !important;
          }

          .ds-two-col, .ds-three-col {
            grid-template-columns: 1fr !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }

          input, select, textarea, .profile-email-readonly, .profile-form-group, .profile-security-block {
            width: 100% !important;
            max-width: 100% !important;
          }

          label, h3 {
            text-align: left !important;
            width: 100% !important;
          }

          .profile-security-block {
            width: 100% !important;
            padding: 24px 16px !important;
            margin: 12px 0 0 0 !important;
          }

          .hub-card {
            align-items: center !important;
            justify-content: center !important;
          }
          
          .address-title-row {
            justify-content: center !important;
            flex-direction: column !important;
            text-align: center !important;
          }
          .address-title-row h3 {
            text-align: center !important;
          }
          .address-card-content, .address-card-content div, .address-card-content span {
            text-align: left !important;
          }
          .address-card-header {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .address-action-buttons {
            align-self: flex-start !important;
          }
        }
      `}} />
    </div>
  )
}
