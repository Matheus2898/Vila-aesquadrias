import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, Loader2, Box, ShoppingCart, Check, ChevronDown } from 'lucide-react'
import { supabase } from '../utils/supabaseClient'
import { useCart } from '../context/CartContext'

export default function Catalog() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedIds, setAddedIds] = useState({})
  const { addToCart } = useCart()

  const [selectedLines, setSelectedLines] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  // CORREÇÃO: Buscar linhas e categorias do banco em vez de hardcoded
  const [availableLines, setAvailableLines] = useState([])
  const [availableCategories, setAvailableCategories] = useState([])

  useEffect(() => {
    const fetchMetadata = async () => {
      // 1. Linhas e Categorias dos produtos ativos
      const { data: productMetadata } = await supabase
        .from('products')
        .select('line, category')
        .eq('is_active', true)

      if (productMetadata) {
        const uniqueLines = Array.from(new Set(productMetadata.map(r => r.line).filter(Boolean))).sort()
        const uniqueCats = Array.from(new Set(productMetadata.map(r => r.category).filter(Boolean))).sort()
        setAvailableLines(uniqueLines)
        setAvailableCategories(uniqueCats)
      }
    }

    const fetchProducts = async () => {
      setLoading(true)
      const { data } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false })
      if (data) setProducts(data)
      setLoading(false)
    }

    fetchMetadata()
    fetchProducts()
  }, [])

  const toggleLine = (linha) => {
    // Seleção única: desmarca se já selecionado, seleciona somente esse
    setSelectedLines(prev => prev.includes(linha) ? [] : [linha])
  }

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const filteredProducts = products.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name && p.name.toLowerCase().includes(q);
      const matchLine = p.line && p.line.toLowerCase().includes(q);
      const matchCat = p.category && p.category.toLowerCase().includes(q);
      if (!matchName && !matchLine && !matchCat) return false;
    }
    if (selectedLines.length > 0 && !selectedLines.includes(p.line)) return false;
    if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
    return true;
  })

  return (
    <div style={{ background: '#F5F5F0', minHeight: '100vh', paddingBottom: '120px' }}>

      {/* Catalog Header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #E8E8E0',
        padding: 'clamp(40px, 10vw, 80px) 0'
      }}>
        <div className="container" style={{ textAlign: 'left' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 900, color: '#000', marginBottom: '8px' }}>Todos os Produtos</h1>
          <p style={{ color: '#666', fontSize: 'clamp(13px, 2vw, 16px)' }}>Catálogo Oficial de Vilaça Esquadrias e Vidros.</p>
        </div>
      </div>

      <div className="container catalog-layout" style={{ paddingTop: '40px' }}>

        {/* SIDEBAR FILTROS */}
        <aside className="catalog-sidebar">
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px',
              fontWeight: 900, color: '#000', fontSize: '18px', background: 'none',
              border: 'none', cursor: 'pointer', padding: 0, width: '100%',
              justifyContent: 'flex-start'
            }}
          >
            <Filter size={20} /> Filtros
            {window.innerWidth <= 768 && <ChevronDown size={18} style={{ marginLeft: 'auto', transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />}
          </button>

          <div style={{
            display: (window.innerWidth > 768 || showFilters) ? 'block' : 'none',
            animation: 'fadeIn 0.3s ease-out'
          }}>

            {/* SEÇÃO LINHA */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#000', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Linha</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {availableLines.map((linha) => (
                  <li key={linha}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: selectedLines.includes(linha) ? 700 : 500 }}>
                      <input
                        type="radio"
                        name="linha-filter"
                        checked={selectedLines.includes(linha)}
                        onChange={() => toggleLine(linha)}
                        onClick={() => selectedLines.includes(linha) && setSelectedLines([])}
                        style={{ accentColor: 'var(--color-navy-800)', width: '16px', height: '16px' }}
                      />
                      {linha}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* SEÇÃO CATEGORIAS */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#000', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>Categorias</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {availableCategories.map((cat) => (
                  <li key={cat}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#555', fontWeight: selectedCategories.includes(cat) ? 700 : 500 }}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        style={{ accentColor: 'var(--color-navy-800)', width: '16px', height: '16px' }}
                      />
                      {cat}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </aside>

        {/* GRID DE PRODUTOS */}
        <main style={{ flex: 1 }}>

          <div style={{ display: 'flex', justifyContent: window.innerWidth <= 768 ? 'center' : 'space-between', alignItems: 'center', marginBottom: '24px', background: 'white', padding: '12px 24px', borderRadius: '8px', border: '1px solid #E8E8E0', textAlign: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>
              Linhas: <strong>{selectedLines.join(', ') || 'Todas'}</strong> | Categorias: <strong>{selectedCategories.join(', ') || 'Todas'}</strong>
              {searchQuery && <span> | Busca: <strong>"{searchQuery}"</strong></span>}
            </span>
            {searchQuery && (
              <button
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('q');
                  setSearchParams(newParams);
                }}
                style={{ background: 'none', border: '1px solid currentColor', padding: '4px 12px', borderRadius: '30px', fontSize: '12px', cursor: 'pointer', color: '#666' }}
              >Limpar busca</button>
            )}
          </div>

          {/* GRID DINAMICO */}
          {loading ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: '#666' }} />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center', color: '#888', background: 'white', borderRadius: '8px', border: '1px solid #E8E8E0' }}>
              <Box size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              Nenhum produto cadastrado com estes filtros no banco de dados.
            </div>
          ) : (
            <div className="ecommerce-grid">
              {filteredProducts.map((p) => (
                <div key={p.id} className="card-ds ecommerce-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid #E8E8E0', display: 'flex', flexDirection: 'column', height: '100%', background: 'white' }}>
                  <Link to={`/produtos/${p.id}`} style={{ height: '240px', background: '#F5F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', textDecoration: 'none', backgroundImage: `url("${p.image_url || '/img-porta.png'}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="glass-dark" style={{ position: 'absolute', bottom: '12px', right: '12px', padding: '4px 12px', borderRadius: '4px', color: 'white', fontSize: '11px', fontWeight: 600 }}>PRONTA ENTREGA</div>
                  </Link>
                  <div style={{
                    padding: '24px', display: 'flex', flexDirection: 'column', flex: 1,
                    alignItems: window.innerWidth <= 768 ? 'center' : 'flex-start',
                    textAlign: window.innerWidth <= 768 ? 'center' : 'left'
                  }}>
                    <Link to={`/produtos/${p.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#000', marginBottom: '4px' }}>{p.name}</h3>
                    </Link>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#FFFFFF', display: 'inline-block', border: '1px solid #E5E7EB', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}></span>
                      <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#000000', display: 'inline-block', border: '1px solid #000000' }}></span>
                    </div>
                    <div style={{ marginTop: 'auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: window.innerWidth <= 768 ? 'center' : 'flex-start' }}>
                      {p.old_price && <span style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '2px', textDecoration: 'line-through' }}>De R$ {Number(p.old_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-navy-800)', marginBottom: '16px' }}>R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                      <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-start' }}>
                        <Link to={`/produtos/${p.id}`} className="btn-ds btn-primary" style={{ padding: '12px 24px', fontSize: '13px', flex: window.innerWidth <= 768 ? 1 : '0 1 auto', minWidth: '140px' }}>Ver produto</Link>
                        <button
                          onClick={() => {
                            addToCart(p)
                            setAddedIds(prev => ({ ...prev, [p.id]: true }))
                            setTimeout(() => setAddedIds(prev => ({ ...prev, [p.id]: false })), 1800)
                          }}
                          className={addedIds[p.id] ? '' : 'btn-ds btn-primary'}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '44px', height: '44px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            transition: 'all 0.2s',
                            ...(addedIds[p.id] ? { background: '#ECFDF5', color: '#15803D' } : {})
                          }}
                        >
                          {addedIds[p.id] ? <Check size={16} /> : <ShoppingCart size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

    </div>
  )
}
