import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Truck, ShieldCheck, CreditCard, ArrowRight, Loader2, ShoppingCart } from 'lucide-react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import { supabase } from '../utils/supabaseClient'
import { useCart } from '../context/CartContext'

const DEFAULT_BANNERS = [
  {
    id: 'default-1',
    image_url: 'https://images.unsplash.com/photo-1600607688969-a5bfcd64bd40?q=80&w=2000',
    background_position: 'center',
    badge_text: 'LANÇAMENTOS PREMIUM',
    badge_style: 'badge-amber',
    title_line1: 'Esquadrias a ',
    title_highlight: 'Pronta entrega',
    highlight_color: '#ffed0c',
    subtitle: 'Design patenteado com conforto térmico e acústico superior para projetos de alto padrão.',
    button_text: 'Explorar Linha 2026',
    button_link: '/produtos',
    button_bg_color: '#ffed0c',
    button_text_color: '#000000',
    button_class: 'btn-ds scroll-top'
  },
  {
    id: 'default-2',
    image_url: '/img-porta.png',
    background_position: 'center',
    badge_text: 'PORTAS PIVOTANTES',
    badge_style: 'badge-glass',
    title_line1: 'Imponência e ',
    title_highlight: 'Elegância',
    highlight_color: 'white',
    subtitle: 'Feitas sob medida para entradas monumentais. Segurança incomparável com puxadores maciços.',
    button_text: 'Ver Catálogo de Portas',
    button_link: '/produtos',
    button_bg_color: 'var(--color-navy-900)',
    button_text_color: 'white',
    button_class: 'btn-ds btn-primary'
  },
  {
    id: 'default-3',
    image_url: 'https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?q=80&w=2000',
    background_position: 'center 40%',
    badge_text: 'PORTAS PREMIUM ACM',
    badge_style: 'badge-glass',
    title_line1: 'Vanguarda e ',
    title_highlight: 'Sustentabilidade',
    highlight_color: 'white',
    subtitle: 'Alta resistência estrutural e leveza com Portas revestidas em ACM e Painéis Ripados de alto padrão.',
    button_text: 'Conheça a Linha',
    button_link: '/produtos',
    button_bg_color: 'var(--color-navy-900)',
    button_text_color: 'white',
    button_class: 'btn-ds btn-primary'
  },
  {
    id: 'default-4',
    image_url: 'https://images.unsplash.com/photo-1545620894-0cfbde2c0d89?q=80&w=2000',
    background_position: 'center 40%',
    badge_text: 'CONTROLE SOLAR',
    badge_style: 'badge-glass',
    title_line1: 'Brises e ',
    title_highlight: 'Painéis Ripados',
    highlight_color: 'white',
    subtitle: 'Conforto térmico, privacidade e estética imponente. Em modelos fixos, deslizantes ou camarão.',
    button_text: 'Solicitar Orçamento',
    button_link: '/produtos',
    button_bg_color: 'var(--color-navy-900)',
    button_text_color: 'white',
    button_class: 'btn-ds btn-primary'
  }
]

export default function Home() {
  const { addToCart } = useCart()
  const [launches, setLaunches] = useState([])

  const [loadingLaunches, setLoadingLaunches] = useState(true)

  const [dbBanners, setDbBanners] = useState([])
  const [loadingBanners, setLoadingBanners] = useState(true)

  useEffect(() => {
    const fetchBanners = async () => {
      setLoadingBanners(true)
      const { data, error } = await supabase
        .from('home_banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (!error && data && data.length > 0) {
        setDbBanners(data)
      } else {
        setDbBanners([]) // Vai forçar o fallback
      }
      setLoadingBanners(false)
    }

    const fetchLaunches = async () => {
      setLoadingLaunches(true)
      const { data } = await supabase
        .from('products')
        .select('id, name, price, old_price, image_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4)
      if (data) setLaunches(data)
      setLoadingLaunches(false)
    }
    fetchBanners()
    fetchLaunches()
  }, [])

  const activeBanners = (!loadingBanners && dbBanners.length > 0) ? dbBanners : DEFAULT_BANNERS

  return (
    <div className="page-home">

      <section className="hero-slider hero-slider-container">

        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          loop={true}
          style={{ width: '100%', height: '100%' }}
        >
          {activeBanners.map((banner, index) => {
            const isFirst = index === 0;
            const isDbBanner = !!banner.title_line1; // db banners use title_line1 natively

            const alignValue = banner.content_align || 'left';
            const offsetX = banner.content_offset_x || 0;
            const titleSize = banner.title_size || 75;

            let jc = 'flex-start';
            let ta = 'left';
            if (alignValue === 'center') { jc = 'center'; ta = 'center'; }
            if (alignValue === 'right') { jc = 'flex-end'; ta = 'right'; }

            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
              jc = 'center';
              ta = 'center';
            }

            const displayImageUrl = (isMobile && banner.image_mobile_url) ? banner.image_mobile_url : banner.image_url;

            return (
              <SwiperSlide key={banner.id}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${displayImageUrl}")`, backgroundSize: 'cover', backgroundPosition: banner.background_position || 'center' }}></div>

                {/* Fallback dark gradient is removed here so it doesn't darken the user's custom blue background */}

                <div className="container" style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center', justifyContent: jc }}>
                  <div className={`hero-content-inner align-${alignValue} ${Math.abs(offsetX) > 0 ? 'has-offset' : ''}`} style={{
                    '--custom-offset': `${offsetX}%`,
                    maxWidth: alignValue === 'center' ? '800px' : 'clamp(280px, 46vw, 650px)',
                    width: '100%',
                    textAlign: ta
                  }}>

                    {banner.badge_text && (
                      <div className={banner.badge_style || ''} style={{
                        display: 'inline-block',
                        padding: isMobile ? '6px 20px' : 'clamp(4px, 0.35vw, 6px) clamp(12px, 1.1vw, 20px)',
                        borderRadius: '999px',
                        background: banner.badge_style === 'badge-amber' ? 'var(--color-amber-500)' : (isDbBanner ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.1)'),
                        backdropFilter: banner.badge_style === 'badge-amber' ? 'none' : 'blur(8px)',
                        color: banner.badge_style === 'badge-amber' ? 'var(--color-navy-900)' : 'white',
                        fontWeight: 800,
                        fontSize: isMobile ? '12px' : 'clamp(9px, 0.75vw, 13px)',
                        marginBottom: isMobile ? '16px' : 'clamp(8px, 1.3vw, 24px)',
                        letterSpacing: '1px',
                        border: banner.badge_style === 'badge-amber' ? 'none' : '1px solid rgba(255,255,255,0.2)'
                      }}>
                        {banner.badge_text}
                      </div>
                    )}

                    {(banner.title_line1 || banner.title_highlight) && (
                      <h1 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: isMobile ? `clamp(28px, 8vw, ${titleSize * 0.7}px)` : `clamp(22px, ${titleSize / 19.2}vw, ${titleSize}px)`,
                        fontWeight: 800,
                        color: 'white',
                        lineHeight: 1.1,
                        marginBottom: isMobile ? '16px' : 'clamp(8px, 1.3vw, 24px)',
                        textShadow: '0 4px 40px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)',
                        wordWrap: 'break-word'
                      }}>
                        {banner.title_line1} {banner.title_line1 && banner.title_highlight && <br />}
                        {banner.title_highlight && (
                          <span style={{
                            color: banner.highlight_color || '#ffed0c',
                            display: isFirst ? 'block' : 'inline',
                            marginTop: isFirst ? '8px' : '0',
                            textShadow: '0 4px 40px rgba(0,0,0,0.6), 0 2px 10px rgba(0,0,0,0.4)',
                            wordWrap: 'break-word'
                          }}>
                            {banner.title_highlight}
                          </span>
                        )}
                      </h1>
                    )}

                    {banner.subtitle && (
                      <p className="t-body1" style={{
                        color: 'rgba(255,255,255,0.95)',
                        fontSize: isMobile ? '15px' : 'clamp(11px, 1.05vw, 20px)',
                        marginBottom: isMobile ? '24px' : 'clamp(16px, 2.1vw, 40px)',
                        lineHeight: 1.5,
                        fontWeight: 500,
                        textShadow: '0 2px 20px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)'
                      }}>
                        {banner.subtitle}
                      </p>
                    )}

                    {banner.button_text && (
                      <Link to={banner.button_link || '/produtos'} className={banner.button_class || (isDbBanner ? 'btn-ds' : 'btn-ds btn-primary')} style={{
                        display: 'inline-flex', alignItems: 'center', gap: isMobile ? '12px' : 'clamp(6px, 0.65vw, 12px)',
                        padding: isMobile ? '16px 32px' : 'clamp(8px, 0.85vw, 16px) clamp(16px, 1.7vw, 32px)',
                        fontSize: isMobile ? '14px' : 'clamp(12px, 0.85vw, 16px)',
                        backgroundColor: banner.button_bg_color || (isDbBanner ? 'var(--color-navy-900)' : undefined),
                        color: banner.button_text_color || (isDbBanner ? 'white' : undefined),
                        border: isDbBanner ? 'none' : undefined,
                        fontWeight: 800
                      }}>
                        {banner.button_text} {isFirst && <ArrowRight style={{ width: isMobile ? '20px' : 'clamp(14px, 1.05vw, 20px)', height: isMobile ? '20px' : 'clamp(14px, 1.05vw, 20px)' }} />}
                      </Link>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </section>

      {/* 2. Barra de Confiança */}
      <section className="trust-bar-section">
        <div className="trust-bar-container">
          <div className="trust-bar-item">
            <Truck strokeWidth={1.5} />
            <div>
              <strong className="trust-bar-title">Frete Grátis</strong>
              <span className="trust-bar-subtitle">Para todo o Brasil*</span>
            </div>
          </div>
          <div className="trust-bar-item">
            <ShieldCheck strokeWidth={1.5} />
            <div>
              <strong className="trust-bar-title">Garantia 5 Anos</strong>
              <span className="trust-bar-subtitle">Em toda a linha Premium</span>
            </div>
          </div>
          <div className="trust-bar-item">
            <CreditCard strokeWidth={1.5} />
            <div>
              <strong className="trust-bar-title">Parcelamento</strong>
              <span className="trust-bar-subtitle">Em até 12x sem juros</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRODUTOS EM DESTAQUE (Catálogo Rápido) */}
      <section style={{ padding: '80px 0 120px', background: 'white' }}>
        <div className="container">
          <div style={{
            textAlign: 'center',
            marginBottom: '40px',
            padding: '0 20px'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 4vw, 36px)',
              color: '#000',
              fontWeight: 900,
              marginBottom: '12px',
              lineHeight: 1.2
            }}>Lançamentos</h2>
            <p style={{ color: '#666', fontSize: 'clamp(14px, 2vw, 16px)' }}>A perfeição em cada detalhe de acabamento.</p>
          </div>

          <div className="launches-grid">
            {loadingLaunches ? (
              <div style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center' }}>
                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--color-navy-900)' }} />
              </div>
            ) : launches.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '48px', textAlign: 'center', color: '#888' }}>
                Nenhum produto cadastrado ainda.
              </div>
            ) : (
              launches.map((produto) => (
                <div key={produto.id} className="card-ds ecommerce-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E8E8E0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Link
                    to={`/produtos/${produto.id}`}
                    style={{ height: '240px', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', backgroundImage: `url("${produto.image_url || '/img-porta.png'}")`, backgroundSize: 'cover', backgroundPosition: 'center', textDecoration: 'none' }}
                  >
                    <span className="badge-amber" style={{ position: 'absolute', top: '16px', left: '16px', padding: '4px 8px', fontSize: '11px', fontWeight: 800, zIndex: 10, boxShadow: 'var(--shadow-sm)' }}>NOVO</span>
                    <span style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(26,30,76,0.85)', backdropFilter: 'blur(4px)', color: 'white', padding: '6px 12px', fontSize: '11px', fontWeight: 800, borderRadius: '4px', zIndex: 10 }}>PRONTA ENTREGA</span>
                  </Link>
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Link to={`/produtos/${produto.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#000', marginBottom: '8px', lineHeight: 1.3, transition: 'color 0.2s' }} onMouseOver={(e) => e.target.style.color = 'var(--color-navy-700)'} onMouseOut={(e) => e.target.style.color = '#000'}>{produto.name}</h3>
                    </Link>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#FFFFFF', display: 'inline-block', border: '1px solid #E5E7EB', boxShadow: 'var(--shadow-low)' }}></span>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#000000', display: 'inline-block', border: '1px solid #000000' }}></span>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-navy-900)' }}>R$ {Number(produto.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to={`/produtos/${produto.id}`} className="btn-ds btn-primary" style={{ flex: 1, padding: '14px', fontSize: '14px', textAlign: 'center', borderRadius: '10px' }}>Ver produto</Link>
                        <button
                          onClick={() => addToCart(produto)}
                          className="btn-ds btn-primary"
                          style={{
                            width: '50px',
                            height: '50px',
                            padding: 0,
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          <ShoppingCart size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/produtos" className="btn-ds" style={{ backgroundColor: 'transparent', color: '#000', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>Ver todos os modelos <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

    </div>
  )
}
