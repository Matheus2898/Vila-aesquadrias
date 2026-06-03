import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Box, Tag, LogOut, Menu, X, Layers, Headset, Home, Users, DollarSign, FileText, ClipboardCheck, Boxes, Map, Ticket } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import LogoVidralpha from '../components/LogoVidralpha'

const CUSTOM_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  .layout-admin-root {
    font-family: 'Inter', sans-serif;
  }
  
  .sidebar-transition {
    transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-item-admin {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .nav-item-admin:hover:not(.active) {
    background: rgba(255, 255, 255, 0.1);
  }

  .nav-item-admin.active {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.25);
    box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.05), 0 4px 10px rgba(0,0,0,0.05);
    color: white !important;
  }

  /* Efeito Vidro Sutil */
  .header-glass {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(229, 231, 235, 0.6);
  }

  .custom-scrollbar::-webkit-scrollbar { width: 5px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .no-scrollbar::-webkit-scrollbar { display: none; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`

export default function LayoutAdmin() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // O texto desaparece instantaneamente se shrink, aparece com delay se expand
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) {
        setIsExpanded(false)
        setShowText(false)
      }
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const toggleDesktopSidebar = () => {
    if (isExpanded) {
      setShowText(false)
      setIsExpanded(false)
    } else {
      setIsExpanded(true)
      setTimeout(() => setShowText(true), 150)
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileOpen(prev => !prev)
    setShowText(true)
  }

  // Mesmas funcionalidades de antes (não mudou as rotas ou o funcionamento)
  const navItems = [
    { path: '/admin', label: 'Início', icon: Home },
    { path: '/admin/produtos', label: 'Gestão de Produtos', icon: Box },
    { path: '/admin/pedidos', label: 'Gestão de Pedidos', icon: LayoutDashboard },
    { path: '/admin/custo-itens', label: 'Custo dos Itens', icon: Tag },
    { path: '/admin/usuarios', label: 'Gestão de Usuários', icon: Users },
    { path: '/admin/cupons', label: 'Gestão de Cupons', icon: Ticket },
    { path: '/admin/banners', label: 'Gestão de Banners', icon: Layers },
    { path: '/app', label: 'Voltar para o Site', icon: LogOut, flip: true },
  ]

  const SIDEBAR_W_EXP = 260
  const SIDEBAR_W_COL = 88

  const sidebarContent = (
    <>
      <div className="sidebar-transition" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0', flexShrink: 0 }}>
        <button
          onClick={isMobile ? toggleMobileSidebar : toggleDesktopSidebar}
          style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {isExpanded || isMobile ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '24px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          const expanded = isExpanded || isMobile
          const marginX = expanded ? '4px' : '12px'

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item-admin ${isActive ? 'active' : ''}`}
              onClick={isMobile ? toggleMobileSidebar : undefined}
              title={!expanded ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: expanded ? '16px' : '0',
                justifyContent: expanded ? 'flex-start' : 'center',
                padding: expanded ? '0 16px' : '0',
                height: '48px',
                borderRadius: '12px',
                color: isActive ? 'white' : 'rgba(255,255,255,0.9)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '14px',
                margin: `0 ${marginX}`,
              }}
            >
              <div style={{ width: '20px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={expanded ? 18 : 20} style={{ transform: item.flip ? 'scaleX(-1)' : 'none' }} />
              </div>

              {expanded && showText && (
                <span style={{ whiteSpace: 'nowrap', animation: 'fadeIn 0.3s' }}>{item.label}</span>
              )}

              {/* Tag opcional do exemplo Alumy se quiser */}
              {item.label === 'Custo dos Itens' && expanded && showText && (
                <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 800, background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', padding: '2px 6px', borderRadius: '4px' }}>PLUS</span>
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      <style>{CUSTOM_CSS}</style>

      {/* BACKGROUND DA TELA IGUAL O TEMPLATE (#F4F7FB) COM GAP FLUTUANTE */}
      <div className="layout-admin-root" style={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#F4F7FB', padding: isMobile ? '12px' : '20px', gap: isMobile ? '0' : '20px', color: '#1E293B', boxSizing: 'border-box' }}>

        {/* ══════════════════════════════════════════════
            DESKTOP SIDEBAR (100% flutuante, rounded)
        ══════════════════════════════════════════════ */}
        {!isMobile && (
          <aside className="sidebar-transition" style={{ position: 'sticky', top: '20px', background: 'var(--color-navy-900)', color: 'white', width: isExpanded ? `${SIDEBAR_W_EXP}px` : `${SIDEBAR_W_COL}px`, height: 'calc(100vh - 40px)', borderRadius: '24px', display: 'flex', flexDirection: 'column', flexShrink: 0, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', zIndex: 30 }}>
            {sidebarContent}
          </aside>
        )}

        {/* ══════════════════════════════════════════════
            MOBILE BACKDROP E DRAWER (adaptado)
        ══════════════════════════════════════════════ */}
        {isMobile && (
          <>
            <div onClick={toggleMobileSidebar} style={{ position: 'fixed', inset: 0, zIndex: 40, background: isMobileOpen ? 'rgba(0,0,0,0.5)' : 'transparent', pointerEvents: isMobileOpen ? 'all' : 'none', transition: 'background 0.3s', backdropFilter: isMobileOpen ? 'blur(2px)' : 'none' }} />
            <aside style={{ position: 'fixed', top: '12px', left: '12px', bottom: '12px', width: `${SIDEBAR_W_EXP}px`, zIndex: 50, transform: isMobileOpen ? 'translateX(0)' : 'translateX(calc(-100% - 12px))', transition: 'transform 0.38s cubic-bezier(0.16,1,0.3,1)', background: 'var(--color-navy-900)', color: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', boxShadow: isMobileOpen ? '8px 0 40px rgba(0,0,0,0.35)' : 'none', overflow: 'hidden' }}>
              {sidebarContent}
            </aside>
          </>
        )}

        {/* ══════════════════════════════════════════════
            MAIN CONTENT COLUMN
        ══════════════════════════════════════════════ */}
        <div id="main-column" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* HEADER FLUTUANTE (GLASS EFFECT) */}
          <header className="header-glass" style={{ position: 'sticky', top: isMobile ? '12px' : '20px', borderRadius: '24px', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, zIndex: 20, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isMobile ? (
                <button onClick={toggleMobileSidebar} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#F3F4F6', color: '#1F2937', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Menu size={20} />
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <LogoVidralpha height={36} showLabel={false} />
                  <span style={{ fontSize: '9px', fontWeight: 800, background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', padding: '4px 8px', borderRadius: '6px', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>ADMIN</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {!isMobile && (
                <button style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'all 0.2s' }} title="Suporte">
                  <Headset size={16} />
                </button>
              )}

              {!isMobile && <div style={{ width: '1px', height: '28px', background: '#E5E7EB', margin: '0 4px' }} />}

              <div className="admin-header-user" onClick={() => navigate('/app/perfil')} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                  ) : (
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      {(profile?.full_name || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {!isMobile && (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>{profile?.full_name || 'Administrador'}</span>
                    <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                      {profile?.role === 'admin' ? 'Gerência' : 'Equipe'}
                    </span>
                  </div>
                )}

                <button onClick={(e) => { e.stopPropagation(); handleLogout(); }} style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', marginLeft: isMobile ? '0' : '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#1F2937'} onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'} title="Sair do sistema">
                  <LogOut size={18} />
                </button>
              </div>
            </div>

          </header>

          {/* ÁREA DE RENDERIZAÇÃO DA PÁGINA COM SCROLL EMBUTIDO */}
          <main style={{ marginTop: '20px', paddingBottom: '40px' }}>
            <Outlet />
          </main>

        </div>
      </div>
    </>
  )
}
