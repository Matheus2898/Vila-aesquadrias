import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Search, User, ShoppingCart, X, Instagram, Facebook, Linkedin, Menu, Loader2, LogOut } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import CartDrawer from '../components/CartDrawer'
import LogoVidralpha from '../components/LogoVidralpha'
import MegaMenu from '../components/MegaMenu'

export default function LayoutPublic() {
  const navigate = useNavigate()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/produtos?q=${encodeURIComponent(searchQuery)}`)
      setIsMobileMenuOpen(false)
    }
  }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [forgotSent, setForgotSent] = useState(false)
  const { user, profile, signOut } = useAuth()
  const { totalItems, setIsOpen: openCart } = useCart()
  const firstName = profile?.full_name?.split(' ')[0] || user?.user_metadata?.full_name?.split(' ')[0] || 'Visitante'

  // Fecha o menu mobile ao navegar
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        setIsLoginOpen(false)
        navigate('/app')
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        })
        if (error) throw error
        toast.success('Cadastro realizado com sucesso! Faça login para continuar.', {
          duration: 6000,
          style: {
            background: '#1a1e4c',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)'
          },
          iconTheme: {
            primary: '#F5B900',
            secondary: '#1a1e4c',
          },
        })
        setAuthMode('login')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app`
      })
      if (error) throw error
      setForgotSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="layout-public" style={{ position: 'relative' }}>
      {/* GLOBAL FIXED HEADER WRAPPER */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>

        {/* 1. TOP ANNOUNCEMENT BAR */}
        <div style={{
          background: '#000000', color: 'white', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isMobile ? '16px' : '11px', fontWeight: 800, padding: '0 10px', textAlign: 'center',
          position: 'relative', zIndex: 10, whiteSpace: 'nowrap', overflow: 'hidden'
        }}>
          {isMobile && window.innerWidth < 400
            ? 'FRETE GRÁTIS ACIMA DE 3 UNIDADES'
            : 'TODA LOJA EM ATÉ 10X SEM JUROS • FRETE GRÁTIS ACIMA DE 3 UNIDADES'}
        </div>

        {/* 2. MAIN HEADER */}
        <header style={{
          backgroundColor: '#FFFFFF',
          height: '70px',
          display: 'flex', alignItems: 'center',
          position: 'relative', zIndex: 2
        }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>

            {/* Logo */}
            <Link to="/" onClick={closeMobileMenu} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <LogoVidralpha
                showLabel={false}
                height={isMobile ? 32 : 41}
                labelColor="#000"
              />
            </Link>

            {/* Navegação Central — Desktop Only */}
            <nav className="header-nav-desktop" style={{ marginLeft: '60px', marginRight: 'auto', display: isMobile ? 'none' : 'flex', gap: '32px' }}>
              <Link to="/" style={{ color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-800)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>Início</Link>
              <Link to="/produtos" style={{ color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-800)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>Produtos</Link>
              <Link to="/quem-somos" style={{ color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-800)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>Quem Somos</Link>
              <Link to="/faq" style={{ color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-800)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>FAQ</Link>
              <Link to="/contato" style={{ color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-800)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>Contato</Link>
              <Link to="/medidas-tecnicas" style={{ color: '#000', textDecoration: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'var(--font-display)', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-800)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>Medidas</Link>
            </nav>

            {/* Ações (Ícones à Direita) */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: '#000' }}>

              {/* Barra de Pesquisa Fixa — Desktop */}
              <form
                onSubmit={handleSearch}
                className="search-bar hide-on-mobile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.08)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: '30px',
                  padding: '6px 16px',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  width: '240px'
                }}>
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '13px',
                    width: '100%',
                    color: 'var(--color-navy-900)',
                    fontWeight: 500,
                  }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', color: '#666' }}>
                  <Search size={16} />
                </button>
              </form>

              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

                  <Link to="/app" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#000', fontWeight: 700, fontSize: '14px', textDecoration: 'none', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-800)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>
                    <User size={20} strokeWidth={1.5} /> <span className="hide-on-mobile">Olá, {firstName}</span>
                  </Link>
                  <button onClick={() => signOut()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#000', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-red-500)'} onMouseOut={e => e.currentTarget.style.color = '#000'}>
                    <LogOut size={20} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsLoginOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', alignItems: 'center' }}><User size={22} strokeWidth={1.5} /></button>
              )}
              <button onClick={() => openCart(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <ShoppingCart size={22} strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#E11D48', color: 'white', fontSize: '10px', fontWeight: 800, minWidth: '16px', height: '16px', borderRadius: '999px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>{totalItems}</span>
                )}
              </button>

              {/* Botão Hamburguer — Mobile Only */}
              <button
                onClick={() => setIsMobileMenuOpen(prev => !prev)}
                className="header-hamburger"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-navy-900)', display: 'flex', alignItems: 'center' }}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>
        </header>

        {/* 3. CATEGORY MEGA MENU — Desktop Only */}
        {!isMobile && <MegaMenu />}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div onClick={closeMobileMenu} style={{ position: 'fixed', inset: 0, zIndex: 98, background: 'rgba(0,0,0,0.4)' }} />
          <div style={{
            position: 'fixed', top: isMobile ? '110px' : '70px', left: 0, right: 0, bottom: 0, zIndex: 99,
            background: 'white',
            borderBottom: '1px solid #E8E8E0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: '24px 24px 80px',
            display: 'flex', flexDirection: 'column', gap: '0',
            overflowY: 'auto'
          }}>
            {/* 🔍 BARRA DE PESQUISA MOBILE */}
            <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar produtos..."
                  style={{
                    width: '100%',
                    background: '#F5F5F0',
                    border: '1px solid #E8E8E0',
                    borderRadius: '12px',
                    padding: '12px 16px 12px 48px',
                    color: 'var(--color-navy-900)',
                    fontSize: '15px',
                    outline: 'none',
                    fontFamily: 'var(--font-body)'
                  }}
                />
              </div>
            </form>
            {[
              { to: '/', label: 'Início' },
              { to: '/produtos', label: 'Produtos' },

              { to: '/quem-somos', label: 'Quem Somos' },
              { to: '/faq', label: 'Perguntas Frequentes' },
              { to: '/contato', label: 'Contato' },
              { to: '/medidas-tecnicas', label: 'Medidas Técnicas' },
            ].filter(Boolean).map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                style={{
                  color: 'var(--color-navy-900)', textDecoration: 'none',
                  fontSize: '18px', fontWeight: 600,
                  padding: '16px 0', borderBottom: '1px solid #F0F0F0',
                  display: 'block'
                }}
              >
                {item.label}
              </Link>
            ))}
            <a href="https://wa.me/5511934194417" target="_blank" rel="noreferrer"
              style={{
                marginTop: '16px', padding: '16px', borderRadius: '8px',
                background: '#25D366', color: 'white', fontWeight: 700,
                fontSize: '16px', textDecoration: 'none', textAlign: 'center',
                display: 'block'
              }}
            >
              💬 Fale Conosco no WhatsApp
            </a>
          </div>
        </>
      )}

      {/* Carrinho */}
      <CartDrawer />

      {/* Login Modal */}
      {isLoginOpen && (
        <>
          <div onClick={() => setIsLoginOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(5, 5, 10, 0.6)', backdropFilter: 'blur(8px)' }}></div>

          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 'min(380px, calc(100vw - 32px))',
            background: 'rgba(18, 14, 12, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            zIndex: 1000,
            borderRadius: '24px',
            padding: '48px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center'
          }}>

            <button onClick={() => setIsLoginOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: '32px' }}>
              <LogoVidralpha height={50} showLabel={false} labelColor="rgba(255,255,255,0.85)" variant="dark" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, color: 'white', marginBottom: '32px' }}>
              {authMode === 'login' ? 'Bem-vindo de volta!' : authMode === 'forgot' ? 'Recuperar Senha' : 'Crie sua conta'}
            </h3>

            {/* Painel de Recuperação de Senha */}
            {authMode === 'forgot' ? (
              forgotSent ? (
                <div style={{ textAlign: 'center', color: 'white', width: '100%' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: '8px' }}>
                    Link de recuperação enviado para
                  </p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-amber-500)', marginBottom: '24px', wordBreak: 'break-all' }}>{email}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Verifique sua caixa de entrada e spam. O link expira em 1 hora.</p>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {error && <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(255,0,0,0.2)' }}>{error}</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginLeft: '4px' }}>Seu e-mail de cadastro</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', outline: 'none', fontFamily: 'inherit', transition: 'all 0.3s ease' }}
                      onFocus={e => e.target.style.borderColor = 'var(--color-amber-500)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'} />
                  </div>
                  <button disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #1A1E4C 0%, #343B8A 100%)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', fontSize: '15px', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                    {loading ? <Loader2 className="animate-spin" size={20} /> : 'Enviar Link de Recuperação'}
                  </button>
                </form>
              )
            ) : (
              <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && (
                  <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', fontSize: '13px', border: '1px solid rgba(255,0,0,0.2)' }}>
                    {error}
                  </div>
                )}

                {authMode === 'signup' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginLeft: '4px' }}>Nome Completo</label>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', outline: 'none', fontFamily: 'inherit', transition: 'all 0.3s ease' }}
                      onFocus={(e) => e.target.style.borderColor = 'var(--color-amber-500)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'} />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginLeft: '2px' }}>Endereço de e-mail</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ex: contato@email.com"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', outline: 'none', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.3s ease' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-amber-500)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginLeft: '2px' }}>Senha</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', outline: 'none', fontSize: '14px', fontFamily: 'inherit', transition: 'all 0.3s ease' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-amber-500)'} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.2)'} />
                </div>

                {authMode === 'login' && (
                  <div style={{ textAlign: 'left', marginTop: '4px' }}>
                    <button type="button" onClick={() => { setAuthMode('forgot'); setError(null); setForgotSent(false) }} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(255,255,255,0.6)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer' }}>Esqueceu a senha?</button>
                  </div>
                )}

                <button disabled={loading} style={{ width: '100%', boxSizing: 'border-box', marginTop: '8px', padding: '14px', borderRadius: '12px', background: 'var(--gradient-navy)', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 12px rgba(26,30,76,0.5), inset 0 1px 0 rgba(255,255,255,0.2)', color: 'white', fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s ease', opacity: loading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')} onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}>
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'Login' : 'Criar Conta')}
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '32px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              {authMode === 'login' ? (
                <>Você é um novo membro? <button onClick={() => setAuthMode('signup')} style={{ background: 'none', border: 'none', padding: 0, color: 'white', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>Cadastre-se</button></>
              ) : authMode === 'forgot' ? (
                <><button onClick={() => { setAuthMode('login'); setForgotSent(false) }} style={{ background: 'none', border: 'none', padding: 0, color: 'white', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>← Voltar ao Login</button></>
              ) : (
                <>Já possui uma conta? <button onClick={() => setAuthMode('login')} style={{ background: 'none', border: 'none', padding: 0, color: 'white', fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>Faça Login</button></>
              )}
            </div>
          </div>
        </>
      )
      }

      {/* Main Content Render */}
      <main className="main-content" style={{
        flex: 1,
        paddingTop: isMobile ? '70px' : '160px',
        minHeight: 'calc(100vh - 160px)',
        background: '#FFFFFF',
        marginTop: 0,
        position: 'relative',
        zIndex: 1
      }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{
        background: '#F5F5F0',
        padding: '64px 0 32px',
        borderTop: '1px solid #E8E8E0',
        textAlign: 'center'
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>

          {/* Logo e Descrição */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
            <LogoVidralpha height={window.innerWidth <= 768 ? 46 : 50} showLabel={false} labelColor="#000" />
            <p className="t-body2" style={{ color: '#666', maxWidth: '400px', textAlign: 'center', margin: 0 }}>Acessórios e esquadrias em alumínio e arquitetura em vidro temperado sob medida. Qualidade e durabilidade garantidas.</p>
          </div>

          {/* Colunas Links */}
          <div className="footer-links-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            width: '100%',
            gap: '32px'
          }}>
            <div className="ds-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <strong style={{ fontSize: '14px', marginBottom: '16px', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Institucional</strong>
              <Link to="/quem-somos" style={{ color: '#666', textDecoration: 'none', fontSize: '14px', marginBottom: '8px' }}>Quem Somos</Link>
              <Link to="/contato" style={{ color: '#666', textDecoration: 'none', fontSize: '14px', marginBottom: '8px' }}>Fale Conosco</Link>
              <Link to="/faq" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>FAQ</Link>
            </div>
            <div className="ds-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <strong style={{ fontSize: '14px', marginBottom: '16px', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Produtos</strong>
              <Link to="/produtos" style={{ color: '#666', textDecoration: 'none', fontSize: '14px', marginBottom: '8px' }}>Catálogo</Link>
              <Link to="/medidas-tecnicas" style={{ color: '#666', textDecoration: 'none', fontSize: '14px' }}>Especificações Técnicas</Link>
            </div>
            <div className="ds-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <strong style={{ fontSize: '14px', marginBottom: '16px', color: '#000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Redes Sociais</strong>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <a href="#" style={{ color: '#666', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-900)'} onMouseOut={e => e.currentTarget.style.color = '#666'}><Instagram size={24} /></a>
                <a href="#" style={{ color: '#666', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-900)'} onMouseOut={e => e.currentTarget.style.color = '#666'}><Facebook size={24} /></a>
                <a href="#" style={{ color: '#666', transition: 'color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-900)'} onMouseOut={e => e.currentTarget.style.color = '#666'}><Linkedin size={24} /></a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div style={{ borderTop: '1px solid #E8E8E0', width: '100%', paddingTop: '32px', color: '#999', fontSize: '13px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span>&copy; {new Date().getFullYear()} Vilaça Esquadrias e Vidros. Todos os direitos reservados.</span>
            <span style={{ fontWeight: 600 }}>CNPJ: 67.033.863/0001-36</span>
          </div>

        </div>
      </footer>

      {/* FLOAT WHATSAPP GLOBAL */}
      <a href="https://wa.me/5511934194417" target="_blank" rel="noreferrer" className="float-whatsapp">
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="currentColor" style={{ minWidth: '34px' }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.473-1.761-1.645-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" /></svg>
        <span className="float-whatsapp-text">Fale Conosco</span>
      </a>
    </div >
  )
}
