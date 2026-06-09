import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Check, ShieldCheck, Truck, ChevronDown, Share2, Heart, Lock, Loader2, Home, ShoppingCart, CreditCard } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import CustomDropdown from '../components/CustomDropdown'

// ─── Dropdown de Medidas ──────────────────────────────────────────────────────
function MeasureDropdown({ sizes, selectedSize, onSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '14px 18px',
          borderRadius: '10px',
          border: isOpen ? '2px solid var(--color-navy-900)' : '2px solid #E8E8E0',
          background: 'white',
          color: '#000',
          fontSize: '15px',
          fontWeight: 700,
          outline: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isOpen ? '0 0 0 4px rgba(30,36,160,0.08)' : '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📐</span>
          <span>{selectedSize || 'Selecione uma medida...'}</span>
        </span>
        <ChevronDown size={18} color="#666" style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.25s ease',
          flexShrink: 0
        }} />
      </button>

      {isOpen && (
        <ul
          ref={listRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'white',
            border: '2px solid var(--color-navy-900)',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
            zIndex: 100,
            listStyle: 'none',
            padding: '8px',
            margin: 0,
            maxHeight: '280px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
          }}>
          {sizes.map((size) => {
            const isSelected = size === selectedSize
            return (
              <li
                key={size}
                onClick={() => { onSelect(size); setIsOpen(false) }}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: isSelected ? 'var(--color-navy-900)' : 'transparent',
                  color: isSelected ? 'white' : '#222',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '14px',
                  marginBottom: '2px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#F0F4FF' }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {isSelected && <Check size={14} />}
                {size}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function SpecsTable({ data }) {
  if (!data) return (
    <p style={{ color: '#aaa', fontStyle: 'italic', padding: '12px' }}>
      Nenhuma informação cadastrada.
    </p>
  );

  const rows = data.split(/\r?\n|\|/).filter(line => line.trim());

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <tbody>
        {rows.map((row, i) => {
          let label = row.trim();
          let value = '-';

          // Tenta separar por ":" ou por " - " (traço com espaços para não quebrar maxim-ar)
          if (row.includes(':')) {
            const parts = row.split(':');
            label = parts[0].trim();
            value = parts.slice(1).join(':').trim();
          } else if (row.includes(' - ')) {
            const parts = row.split(' - ');
            label = parts[0].trim();
            value = parts.slice(1).join(' - ').trim();
          }

          return (
            <tr key={i} style={{
              background: i % 2 === 0 ? '#F9F9F8' : 'white',
              borderBottom: i === rows.length - 1 ? 'none' : '1px solid #E8E8E0'
            }}>
              <td style={{
                padding: '14px 20px',
                fontWeight: 600,
                color: '#444',
                width: '35%',
                verticalAlign: 'top',
                borderRight: '1px solid #E8E8E0'
              }}>
                {label}
              </td>
              <td style={{
                padding: '14px 20px',
                color: '#555',
                lineHeight: 1.5
              }}>
                {value}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Mapa de cores de vidro para UI 
const getGlassColorHex = (colorName) => {
  const norm = (colorName || '').toLowerCase();
  if (norm.includes('incolor')) return '#e0f2fe';
  if (norm.includes('fum')) return '#4b5563'; // Fumê
  if (norm.includes('verd')) return '#86efac';
  if (norm.includes('bronz')) return '#d97706';
  if (norm.includes('azul')) return '#93c5fd';
  return '#f1f5f9'; // Default transparente/neutro
}

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedSize, setSelectedSize] = useState('1200X2100')
  const [selectedColor, setSelectedColor] = useState('preto')
  const [quantity, setQuantity] = useState(1)
  const [selectedGlassType, setSelectedGlassType] = useState('')
  const [selectedGlassThickness, setSelectedGlassThickness] = useState('')
  const [selectedGlassColor, setSelectedGlassColor] = useState('')
  const [buyWithGlass, setBuyWithGlass] = useState(true)
  const [added, setAdded] = useState(false)
  const { addToCart } = useCart()

  const [cep, setCep] = useState('')
  const [freightLoading, setFreightLoading] = useState(false)
  const [freightResult, setFreightResult] = useState(null)
  const [selectedFreight, setSelectedFreight] = useState(null)
  const [btnHover, setBtnHover] = useState(false)

  const [openTab, setOpenTab] = useState('descricao')
  const [activeImage, setActiveImage] = useState(0)

  async function handleCalculateFreight() {
    if (cep.length !== 8) {
      toast.error("Digite um CEP válido com 8 números.");
      return;
    }
    setFreightLoading(true);
    setFreightResult(null);
    setSelectedFreight(null);

    const currentM = product?.measures?.find(m => m.size === selectedSize);
    const calcWeight = currentM && currentM.weight ? currentM.weight : 0;

    try {
      const { data, error } = await supabase.functions.invoke('lalamove-quote', {
        body: { destinationCep: cep, weight: calcWeight }
      });

      if (error) throw error;

      if (data && data.quotes && data.quotes.length > 0) {
        setFreightResult(data.quotes);
      } else {
        setFreightResult([]);
      }
    } catch (err) {
      console.error("Erro calcular frete Lalamove via Edge:", err);
      setFreightResult([
        {
          price: "-",
          time: "Disponível sob consulta",
          vehicle: "Entrega Restrita - Contate-nos"
        }
      ]);
    }
    setFreightLoading(false);
  }

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()

      if (error || !data) {
        setProduct(null)
        setLoading(false)
        return
      }

      setProduct(data)

      if (data.measures && data.measures.length > 0) {
        setSelectedSize(data.measures[0].size)
      } else {
        const defaultSizes = data.category?.toLowerCase()?.includes('porta')
          ? ['1200X2100', '1500X2100', '2000X2100']
          : ['1.00x2.10', '1.50x2.10', '2.00x2.10', '2.50x2.10']
        setSelectedSize(defaultSizes[0])
      }

      setSelectedGlassType('Comum')
      setSelectedGlassThickness('4mm')
      setSelectedGlassColor('Incolor')

      setLoading(false)
    }
    if (id) fetchProduct()
  }, [id])

  const [glassTypeCosts, setGlassTypeCosts] = useState([])

  useEffect(() => {
    const fetchGlassCosts = async () => {
      const { data: colorData } = await supabase.from('glass_color_costs').select('*')
      if (colorData) setGlassTypeCosts(colorData)
    }
    fetchGlassCosts()
  }, [])

  const dynamicGlassTypes = useMemo(() => {
    const types = new Set(glassTypeCosts.map(g => g.glass_type))
    const arr = Array.from(types).sort()
    return arr.length > 0 ? arr : [selectedGlassType || 'Comum']
  }, [glassTypeCosts, selectedGlassType])

  const dynamicAvailableThickness = useMemo(() => {
    const thicks = new Set(
      glassTypeCosts
        .filter(g => g.glass_type === selectedGlassType)
        .map(g => g.thickness)
    )
    const arr = Array.from(thicks).sort()
    return arr.length > 0 ? arr : [selectedGlassThickness || '4mm']
  }, [glassTypeCosts, selectedGlassType, selectedGlassThickness])

  const dynamicAvailableColors = useMemo(() => {
    const colors = new Set(
      glassTypeCosts
        .filter(g => g.glass_type === selectedGlassType && g.thickness === selectedGlassThickness)
        .map(g => g.color_name)
    )
    const arr = Array.from(colors).sort()
    return arr.length > 0 ? arr : [selectedGlassColor || 'Incolor']
  }, [glassTypeCosts, selectedGlassType, selectedGlassThickness, selectedGlassColor])

  useEffect(() => {
    if (dynamicGlassTypes.length > 0 && !dynamicGlassTypes.includes(selectedGlassType)) {
      setSelectedGlassType(dynamicGlassTypes[0])
    }
  }, [dynamicGlassTypes, selectedGlassType])

  useEffect(() => {
    if (dynamicAvailableThickness.length > 0 && !dynamicAvailableThickness.includes(selectedGlassThickness)) {
      setSelectedGlassThickness(dynamicAvailableThickness[0])
    }
  }, [dynamicAvailableThickness, selectedGlassThickness, selectedGlassType])

  useEffect(() => {
    if (dynamicAvailableColors.length > 0 && !dynamicAvailableColors.includes(selectedGlassColor)) {
      setSelectedGlassColor(dynamicAvailableColors[0])
    }
  }, [dynamicAvailableColors, selectedGlassColor, selectedGlassThickness])

  const areaM2 = useMemo(() => {
    if (!selectedSize) return 1
    const parts = selectedSize.toLowerCase().split('x')
    if (parts.length !== 2) return 1
    let w = parseFloat(parts[0].replace(',', '.'))
    let h = parseFloat(parts[1].replace(',', '.'))
    if (w > 50) w = w / 1000
    if (h > 50) h = h / 1000
    return w * h
  }, [selectedSize])

  const glassPriceM2 = useMemo(() => {
    if (!buyWithGlass || glassTypeCosts.length === 0) return 0
    const searchColor = selectedGlassColor.charAt(0).toUpperCase() + selectedGlassColor.slice(1).toLowerCase()
    const matchingGlass = glassTypeCosts.find(g =>
      g.glass_type === selectedGlassType &&
      g.thickness === selectedGlassThickness &&
      (g.color_name === selectedGlassColor || g.color_name === searchColor)
    )
    return matchingGlass ? parseFloat(matchingGlass.cost_per_m2) : 0
  }, [selectedGlassType, selectedGlassThickness, selectedGlassColor, glassTypeCosts, buyWithGlass])

  const hasDynamicMeasures = product?.measures && product.measures.length > 0
  const sizes = useMemo(() => {
    if (!product) return []
    return hasDynamicMeasures
      ? product.measures.map(m => m.size)
      : (product?.category?.toLowerCase()?.includes('porta')
        ? ['1200X2100', '1500X2100', '2000X2100']
        : ['1.00x2.10', '1.50x2.10', '2.00x2.10', '2.50x2.10'])
  }, [product, hasDynamicMeasures])

  const colorsProntaEntrega = [
    { id: 'branco', name: 'Branco', hex: '#FFFFFF' },
    { id: 'preto', name: 'Preto', hex: '#222222' }
  ]

  const currentColorName = colorsProntaEntrega.find(c => c.id === selectedColor)?.name || selectedColor

  const currentMeasureInfo = useMemo(() => {
    if (!product || !hasDynamicMeasures) return null
    return product.measures.find(m => m.size === selectedSize)
  }, [product, hasDynamicMeasures, selectedSize])

  const displayPrice = useMemo(() => {
    if (!product) return 0
    let base = 0
    if (currentMeasureInfo && currentMeasureInfo.price_without_glass) {
      base = currentMeasureInfo.price_without_glass
    } else if (currentMeasureInfo && currentMeasureInfo.price) {
      base = currentMeasureInfo.price
    } else {
      base = product.price || 0
    }

    if (!buyWithGlass) return base

    const mark = parseFloat(product.markup) || 0
    const tax = parseFloat(product.taxes) || 0
    const glassCost = areaM2 * glassPriceM2
    const glassFinal = glassCost + (glassCost * (mark / 100)) + (glassCost * (tax / 100))

    return base + glassFinal
  }, [product, currentMeasureInfo, buyWithGlass, areaM2, glassPriceM2])

  const displayOldPrice = useMemo(() => {
    if (!product) return null
    return currentMeasureInfo && currentMeasureInfo.old_price
      ? currentMeasureInfo.old_price
      : product.old_price
  }, [product, currentMeasureInfo])

  const displayWeight = useMemo(() => {
    if (!product) return 0
    return currentMeasureInfo && currentMeasureInfo.weight
      ? currentMeasureInfo.weight
      : 0
  }, [product, currentMeasureInfo])

  const galleryImages = useMemo(() => {
    if (!product) return ['/img-porta.png']
    return product.image_urls && product.image_urls.length > 0
      ? product.image_urls
      : (product.image_url ? [product.image_url] : ['/img-porta.png'])
  }, [product])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: '#666' }} />
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F5F5F0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>Produto não encontrado!</h1>
        <Link to="/produtos" className="btn-ds btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}><Home size={18} /> Voltar ao Catálogo</Link>
      </div>
    )
  }

  return (
    <div style={{ background: '#F5F5F0', paddingBottom: '80px' }}>
      <div className="container" style={{ padding: '24px 0' }}>
        <div style={{ fontSize: '13px', color: '#666', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>Início</span> <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
          <span>{product.category || 'Produtos'}</span> <ChevronDown size={14} style={{ transform: 'rotate(-90deg)' }} />
          <strong style={{ color: '#000', fontWeight: 900 }}>{product.name}</strong>
        </div>
      </div>

      <div className="container ds-two-col">
        <div className="product-gallery">
          <div style={{
            width: '100%',
            height: 'clamp(300px, 70vw, 700px)',
            background: '#F5F5F0',
            border: '1px solid #E8E8E0',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: `url("${galleryImages[activeImage]}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.4s ease-in-out'
          }}>
            <div className="glass-effect" style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 16px', borderRadius: '4px', fontSize: '12px', fontWeight: 800, zIndex: 10, display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--color-navy-900)' }}>
              <ShieldCheck size={16} /> Patenteado
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}>
            {galleryImages.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setActiveImage(idx)}
                style={{
                  width: '60px', height: '60px', flexShrink: 0, backgroundImage: `url("${img}")`, backgroundSize: 'cover', backgroundPosition: 'center',
                  border: activeImage === idx ? '2px solid var(--color-amber-500)' : '1px solid #E8E8E0',
                  cursor: 'pointer', borderRadius: '4px', opacity: activeImage === idx ? 1 : 0.6, transition: 'all 0.2s'
                }}
              />
            ))}
          </div>
        </div>

        <div className="product-info-container product-info-container-desktop mobile-centralized" style={{
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h1 className="mobile-centralized" style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 5vw, 40px)',
            fontWeight: 900,
            color: 'var(--color-navy-900)',
            lineHeight: 1.1,
            marginBottom: '16px',
            maxWidth: '100%',
            textAlign: 'left'
          }}>
            {product.name}
          </h1>

          <div className="product-meta-row mobile-centralized" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
            width: '100%',
            justifyContent: 'flex-start'
          }}>
            <div style={{ display: 'flex', color: 'var(--color-amber-500)' }}>★★★★★</div>
            <span style={{ fontSize: '14px', color: '#666', textDecoration: 'underline' }}>(42 avaliações)</span>
          </div>

          <div className="product-price-container mobile-centralized" style={{
            marginBottom: '10px',
            paddingBottom: '20px',
            borderBottom: '1px solid #E8E8E0',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}>
            {displayOldPrice && <span style={{ fontSize: '14px', color: '#666', textDecoration: 'line-through' }}>De R$ {Number(displayOldPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-start',
              gap: '16px',
              marginTop: '4px'
            }}>
              <span style={{
                fontSize: 'clamp(32px, 6vw, 48px)',
                fontWeight: 900,
                color: 'var(--color-navy-900)',
                lineHeight: 1
              }}>R$ {Number(displayPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              {displayOldPrice && <span style={{ fontSize: '16px', color: '#15803D', fontWeight: 600 }}>Promoção</span>}
            </div>
            <div style={{ fontSize: '15px', color: '#666', marginTop: '8px' }}>em até <strong>10x de R$ {(Number(displayPrice) / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> sem juros</div>
          </div>

          <div style={{ marginBottom: '40px', width: '100%' }}>
            {/* 1. Forma de Compra */}
            <div style={{ marginBottom: '24px' }}>
              <div className="size-option-header mobile-centralized" style={{ display: 'flex', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#000', fontWeight: 900 }}>Forma de Compra:</strong>
              </div>
              <div className="size-selector-grid size-selector-mobile-stack mobile-centralized" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={() => setBuyWithGlass(true)} style={{ padding: '12px 20px', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: buyWithGlass ? 'var(--color-navy-900)' : 'white', color: buyWithGlass ? 'white' : 'var(--color-navy-900)', border: buyWithGlass ? '1px solid var(--color-navy-900)' : '1px solid #CCC' }}>
                  Produto Completo (COM VIDRO)
                </button>
                <button onClick={() => setBuyWithGlass(false)} style={{ padding: '12px 20px', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: !buyWithGlass ? 'var(--color-navy-900)' : 'white', color: !buyWithGlass ? 'white' : 'var(--color-navy-900)', border: !buyWithGlass ? '1px solid var(--color-navy-900)' : '1px solid #CCC' }}>
                  Apenas Esquadria (SEM VIDRO)
                </button>
              </div>
            </div>

            {/* 2. Medidas (Dropdown) */}
            <div style={{ marginBottom: '24px', borderTop: '1px solid #E8E8E0', paddingTop: '24px' }}>
              <div className="size-option-header mobile-centralized" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <strong style={{ fontSize: '14px', color: '#000', fontWeight: 900 }}>
                  Medida (Largura x Altura):
                </strong>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: 400 }}>
                  {sizes.length} {sizes.length === 1 ? 'opção disponível' : 'opções disponíveis'}
                </span>
              </div>
              <MeasureDropdown
                sizes={sizes}
                selectedSize={selectedSize}
                onSelect={setSelectedSize}
              />
            </div>

            {/* 3. Personalização de Vidro */}
            {buyWithGlass && (
              <div style={{ marginBottom: '24px', borderTop: '1px solid #E8E8E0', paddingTop: '24px' }}>
                <div className="size-option-header mobile-centralized" style={{ display: 'flex', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <strong style={{ fontSize: '14px', color: '#000', fontWeight: 900, display: 'block', width: '100%' }}>Personalização do Vidro:</strong>
                </div>

                {/* Linha 1: Tipo do Vidro (Botões) */}
                <div className="glass-type-row" style={{ width: '100%', marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo do Vidro</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {['Comum', 'Temperado'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedGlassType(type)}
                        style={{
                          padding: '14px 20px',
                          borderRadius: '10px',
                          fontSize: '14px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          background: selectedGlassType === type ? 'var(--color-navy-900)' : 'white',
                          color: selectedGlassType === type ? 'white' : 'var(--color-navy-900)',
                          border: selectedGlassType === type ? '2px solid var(--color-navy-900)' : '2px solid #E8E8E0',
                          boxShadow: selectedGlassType === type ? '0 4px 12px rgba(30,36,160,0.15)' : 'none',
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {selectedGlassType === type && <Check size={16} />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Linha 2: Espessura e Cor do Vidro Lado a Lado */}
                <div className="glass-config-secondary-row" style={{
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  width: '102%',
                  alignItems: 'flex-start'
                }}>
                  {/* Espessura do Vidro */}
                  <div className="thickness-dropdown-wrapper" style={{ flex: 1, minWidth: '180px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Espessura</label>
                    <CustomDropdown
                      value={selectedGlassThickness}
                      onChange={setSelectedGlassThickness}
                      options={dynamicAvailableThickness}
                    />
                  </div>

                  {/* Cor do Vidro Visual */}
                  <div className="glass-color-selector" style={{ flex: 1.0, minWidth: '240px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#000', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Cor do Vidro: <span style={{ fontWeight: 600, color: '#666', textTransform: 'none' }}>{selectedGlassColor}</span>
                    </label>
                    <div className="color-selector-grid" style={{
                      display: 'flex',
                      gap: '12px',
                      flexWrap: 'wrap',
                      marginTop: '4px'
                    }}>
                      {dynamicAvailableColors.map(colorOption => {
                        const isSelected = selectedGlassColor === colorOption;
                        const hex = getGlassColorHex(colorOption);
                        return (
                          <button
                            key={colorOption}
                            title={colorOption}
                            onClick={() => setSelectedGlassColor(colorOption)}
                            style={{
                              width: '38px', height: '38px', borderRadius: '50%', background: hex,
                              border: isSelected ? '2px solid var(--color-navy-900)' : '1px solid #E8E8E0',
                              boxShadow: isSelected ? '0 0 0 2px white inset, var(--shadow-low)' : 'none',
                              cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Cor do Perfil */}
            <div className="product-option-section" style={{ marginBottom: '24px', borderTop: '1px solid #E8E8E0', paddingTop: '24px' }}>
              <div className="product-option-label mobile-centralized" style={{
                display: 'flex',
                marginBottom: '16px'
              }}>
                <strong style={{ fontSize: '14px', color: '#000', fontWeight: 900 }}>Cor do perfil de alumínio: <span style={{ fontWeight: 400, color: '#666' }}>{currentColorName}</span></strong>
              </div>

              <div className="mobile-centralized" style={{
                fontSize: '12px',
                color: '#888',
                marginBottom: '8px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>Padrão (Pronta Entrega)</div>
              <div className="color-selector-grid mobile-centralized" style={{
                display: 'flex',
                gap: '12px',
              }}>
                {colorsProntaEntrega.map(color => (
                  <button
                    key={color.id}
                    title={color.name}
                    onClick={() => setSelectedColor(color.id)}
                    style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: color.hex,
                      border: selectedColor === color.id ? '2px solid var(--color-navy-900)' : '1px solid #E8E8E0',
                      boxShadow: selectedColor === color.id ? '0 0 0 2px white inset, var(--shadow-low)' : 'none',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 5. Quantidade */}
            <div style={{ marginBottom: '24px', borderTop: '1px solid #E8E8E0', paddingTop: '24px' }}>
              <div className="mobile-centralized" style={{
                fontSize: '12px',
                color: '#888',
                marginBottom: '8px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontWeight: 700
              }}>Quantidade</div>
              <div className="quantity-selector-container mobile-centralized" style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                border: '1px solid #E8E8E0',
                borderRadius: '4px',
                width: 'fit-content'
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666', borderRight: '1px solid #E8E8E0' }}
                >-</button>
                <div style={{ padding: '0 24px', fontSize: '16px', fontWeight: 700 }}>{quantity}</div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ padding: '12px 16px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666', borderLeft: '1px solid #E8E8E0' }}
                >+</button>
              </div>
            </div>

            {/* 6. Calculadora de Frete */}
            <div className="mobile-centralized" style={{ marginTop: '16px', borderTop: '1px solid #E8E8E0', paddingTop: '32px', paddingBottom: '32px', marginBottom: '16px', borderBottom: '1px solid #E8E8E0', width: '100%', display: 'flex', flexDirection: 'column' }}>
              <strong className="mobile-centralized" style={{ fontSize: '14px', color: '#000', fontWeight: 900, display: 'block', marginBottom: '12px' }}>Calcular Frete e Prazo (Lalamove):</strong>
              <div className="mobile-centralized" style={{ display: 'flex', gap: '8px', maxWidth: '300px', width: '100%' }}>
                <input
                  type="text"
                  placeholder="Seu CEP (00000000)"
                  value={cep}
                  maxLength={8}
                  onChange={e => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  style={{ flex: 1, padding: '14px 16px', border: '1px solid #E5E7EB', borderRadius: '4px', outline: 'none', fontSize: '14px', width: '100%' }}
                />
                <button
                  onMouseEnter={() => setBtnHover(true)}
                  onMouseLeave={() => setBtnHover(false)}
                  onClick={handleCalculateFreight}
                  className="btn-ds btn-primary"
                  style={{
                    padding: '14px 24px', fontWeight: 700,
                    borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: freightLoading ? 0.7 : 1, display: 'flex', alignItems: 'center',
                    transform: btnHover && !freightLoading ? 'translateY(-2px)' : 'translateY(0)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {freightLoading ? <Loader2 size={16} className="animate-spin" /> : 'Calcular'}
                </button>
              </div>

              {freightResult && Array.isArray(freightResult) && freightResult.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '400px' }}>
                  {freightResult.map((quote, idx) => {
                    const isSelected = selectedFreight?.vehicle === quote.vehicle && selectedFreight?.price === quote.price;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedFreight(quote)}
                        style={{
                          padding: '16px',
                          background: isSelected ? '#F0F9FF' : 'white',
                          border: isSelected ? '2px solid var(--color-navy-900)' : '1px solid #E5E7EB',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(16, 20, 102, 0.1)' : 'none',
                          position: 'relative',
                          zIndex: 10
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Truck size={20} color={isSelected ? 'var(--color-navy-900)' : '#666'} />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#000' }}>{quote.vehicle}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>{quote.time}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <strong style={{ fontSize: '16px', color: '#15803D' }}>
                            {quote.price === '-' ? quote.price : `R$ ${quote.price}`}
                          </strong>
                          {isSelected && <Check size={18} color="var(--color-navy-900)" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="cta-container-card" style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #E8E8E0',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '32px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <Truck size={20} color="#000" />
              <span style={{ fontSize: '14px', color: '#000', fontWeight: 600 }}>Frete grátis acima de duas unidades</span>
            </div>

            {/* ─── BOTÃO COMPRAR AGORA (Checkout Mercado Pago) ─── */}
            <button
              onClick={() => {
                const prazoBase = product?.prazo_base ?? 5;
                const diasExtras = product?.dias_extras_por_unidade ?? 1;
                addToCart({
                  product_id: product.id,
                  name: product.name,
                  price: displayPrice,
                  quantity,
                  image: galleryImages[0],
                  prazo_base: prazoBase,
                  dias_extras_por_unidade: diasExtras,
                  options: {
                    size: selectedSize,
                    color: currentColorName,
                    variant_sku: product.sku_base,
                  }
                });
                window.location.href = '/carrinho';
              }}
              className="btn-ds"
              style={{
                width: '100%',
                marginBottom: '12px',
                padding: window.innerWidth <= 768 ? '16px 0' : '20px 0',
                fontSize: window.innerWidth <= 768 ? '16px' : '18px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderRadius: '999px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                cursor: 'pointer',
                background: 'var(--color-navy-900)',
                color: 'white'
              }}
              onMouseOver={e => { e.currentTarget.style.opacity = '0.85'; }}
              onMouseOut={e => { e.currentTarget.style.opacity = '1'; }}
            >
              <CreditCard size={22} />
              Comprar Agora
            </button>

            <a
              href={`https://wa.me/5511934194417?text=${encodeURIComponent(`Olá, tenho interesse no produto ${product.name} (SKU Base: ${product.sku_base || 'N/A'}). \n\nTamanho: ${selectedSize}\nCor do Perfil: ${currentColorName}\nVidro: ${buyWithGlass ? `${selectedGlassType} ${selectedGlassThickness} ${selectedGlassColor}` : 'Sem Vidro'}\nQuantidade: ${quantity}\nValor aproximado: R$ ${Number(displayPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                width: '100%',
                padding: window.innerWidth <= 768 ? '14px 0' : '16px 0',
                fontSize: window.innerWidth <= 768 ? '14px' : '16px',
                fontWeight: 700,
                borderRadius: '999px',
                border: '2px solid #25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s',
                cursor: 'pointer',
                textDecoration: 'none',
                background: 'transparent',
                color: '#25D366'
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Orçar pelo WhatsApp
            </a>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
              <ShieldCheck size={14} /> Compra 100% Segura. Seus dados estão protegidos.
            </div>
          </div>


          <div style={{ borderTop: '1px solid #E8E8E0', width: '100%', marginTop: '32px' }}>

            <div style={{ borderBottom: '1px solid #E8E8E0' }}>
              <div onClick={() => setOpenTab(openTab === 'descricao' ? null : 'descricao')} style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 900, color: '#000' }}>
                Descrição do Produto <ChevronDown size={20} style={{ transform: openTab === 'descricao' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
              </div>
              {openTab === 'descricao' && (
                <div style={{ padding: '0 0 24px 0', color: '#666', fontSize: '14px', lineHeight: 1.6 }}>
                  {product.description ? (
                    product.description.split(/\|\n?|\n/).map((item, i) => (
                      item.trim() ? <p key={i} style={{ marginBottom: '8px' }}>{item.trim()}</p> : null
                    ))
                  ) : (
                    <p style={{ color: '#aaa', fontStyle: 'italic' }}>Nenhuma descrição cadastrada para este produto.</p>
                  )}
                </div>
              )}
            </div>

            <div style={{ borderBottom: '1px solid #E8E8E0' }}>
              <div onClick={() => setOpenTab(openTab === 'especificacoes' ? null : 'especificacoes')} style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 900, color: '#000' }}>
                Especificações Técnicas <ChevronDown size={20} style={{ transform: openTab === 'especificacoes' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
              </div>
              {openTab === 'especificacoes' && (
                <div style={{ padding: '0 0 32px 0' }}>
                  <div style={{ border: '1px solid #E8E8E0', borderRadius: '4px', overflow: 'hidden' }}>
                    {/* Seção de Selos de Qualidade Integrada */}
                    <div style={{
                      background: '#F8F8F8',
                      padding: '16px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #E8E8E0'
                    }}>
                      <span style={{ fontSize: '16px', fontWeight: 600, color: '#444' }}>Selos de Qualidade</span>
                      <img
                        src="/selo-qualidade.webp"
                        alt="Selos PBQP-H e AFEAL"
                        style={{ height: '42px', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{
                      background: 'white',
                      padding: '16px 24px',
                      borderBottom: '1px solid #E8E8E0',
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#444'
                    }}>
                      Produto Qualificado
                    </div>
                    <SpecsTable data={product.specs} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ borderBottom: '1px solid #E8E8E0' }}>
              <div onClick={() => setOpenTab(openTab === 'garantia' ? null : 'garantia')} style={{ padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 900, color: '#000' }}>
                Garantia e Instalação <ChevronDown size={20} style={{ transform: openTab === 'garantia' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
              </div>
              {openTab === 'garantia' && (
                <div style={{ padding: '0 0 24px 0' }}>
                  <SpecsTable data={product.warranty} />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
