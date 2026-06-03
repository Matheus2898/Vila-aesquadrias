import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function MegaMenu() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoriesByLine, setCategoriesByLine] = useState({});
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [productIndices, setProductIndices] = useState({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);

    const fetchData = async () => {
      // 1. Busca linhas que são do tipo 'esquadria'
      const { data: linesData } = await supabase
        .from('product_lines')
        .select('name')
        .eq('line_type', 'esquadria');

      const validLines = linesData ? linesData.map(l => l.name) : [];

      const normalizeCategory = (cat) => {
        if (!cat) return '';
        return cat.trim().toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
      };

      // 2. Busca categorias da tabela item_costs
      const { data: costData } = await supabase
        .from('item_costs')
        .select('category, line')
        .not('category', 'is', null);

      if (costData) {
        // Filtra para manter somente as linhas válidas e normaliza as categorias
        const filteredCostData = costData
          .filter(r => validLines.includes(r.line))
          .map(r => ({ ...r, category: normalizeCategory(r.category) }));

        // Pega as categorias únicas, filtra, ordena e limita a 10
        const uniqueCategories = Array.from(new Set(filteredCostData.map(r => r.category)))
          .filter(Boolean)
          .sort()
          .slice(0, 10);

        setCategories(uniqueCategories);

        // Agrupar linhas por categoria para o submenu
        const catLines = {};
        filteredCostData.forEach(r => {
          if (!uniqueCategories.includes(r.category)) return;
          if (!catLines[r.category]) catLines[r.category] = new Set();
          if (r.line) catLines[r.category].add(r.line);
        });
        setCategoriesByLine(catLines);

        // Initialize indices for categories
        const initialIndices = {};
        uniqueCategories.forEach(cat => { initialIndices[cat] = 0; });
        setProductIndices(initialIndices);
      }

      // 2. Busca produtos ativos para o card de destaque no dropdown
      const { data: productData } = await supabase
        .from('products')
        .select('id, name, line, category, image_url, price, old_price')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productData) {
        setProducts(productData.map(p => ({ ...p, category: normalizeCategory(p.category) })));
      }
    };

    fetchData();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNextProduct = (cat, catProductsLength, e) => {
    e.preventDefault();
    e.stopPropagation();
    setProductIndices(prev => ({
      ...prev,
      [cat]: (prev[cat] + 1) % catProductsLength
    }));
  };

  const handlePrevProduct = (cat, catProductsLength, e) => {
    e.preventDefault();
    e.stopPropagation();
    setProductIndices(prev => ({
      ...prev,
      [cat]: (prev[cat] - 1 + catProductsLength) % catProductsLength
    }));
  };

  return (
    <nav className="category-navbar hide-scrollbar" style={{
      background: 'white', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #E2E8F0', height: '46px', display: 'flex', alignItems: 'center', overflowX: isMobile ? 'auto' : 'visible', overflowY: 'visible', whiteSpace: 'nowrap', WebkitOverflowScrolling: 'touch', zIndex: 1, position: 'relative'
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'center', gap: isMobile ? '24px' : '36px', paddingLeft: isMobile ? '16px' : undefined, paddingRight: isMobile ? '16px' : undefined, height: '100%', alignItems: 'center', margin: '0 auto', width: '100%', position: 'relative' }} onMouseLeave={() => !isMobile && setHoveredCategory(null)}>

        {categories.map(cat => {
          // Linhas do submenu vêm de item_costs (categoriesByLine) — sempre disponíveis
          const uniqueLines = categoriesByLine[cat]
            ? Array.from(categoriesByLine[cat]).sort()
            : [];
          // Produtos apenas para o card de destaque — pode estar vazio
          const catProducts = products.filter(p => p.category === cat);
          const isOpen = hoveredCategory === cat && !isMobile;
          const currentProdIndex = productIndices[cat] || 0;
          const currentProduct = catProducts[currentProdIndex];

          return (
            <div key={cat} style={{ height: '100%', display: 'flex', alignItems: 'center', position: 'relative' }} onMouseEnter={() => !isMobile && setHoveredCategory(cat)}>
              <Link to={`/produtos?q=${encodeURIComponent(cat)}`} style={{ color: isOpen ? 'var(--color-navy-900)' : '#475569', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s', height: '100%', position: 'relative' }}>
                {cat}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: isOpen ? 1 : 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'all 0.3s' }}>
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Active Underline indicator */}
                {isOpen && <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', background: 'var(--color-amber-500)', borderTopLeftRadius: '3px', borderTopRightRadius: '3px' }} />}
              </Link>

              {/* MEGA MENU DROPDOWN PANEL */}
              {isOpen && (
                <div style={{
                  position: 'absolute', top: '46px', left: '50%', transform: 'translateX(-50%)', width: 'max-content', minWidth: '600px', maxWidth: '800px', background: 'white',
                  border: '1px solid #E2E8F0', borderTop: 'none', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.1)', display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 300px',
                  padding: '32px', gap: '32px', zIndex: 100, animation: 'fadeIn 0.2s ease-out', cursor: 'default'
                }}>
                  {/* Left Column: Lines/Subcategories */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-navy-900)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => window.location.href = `/produtos?q=${encodeURIComponent(cat)}`}>
                      {cat} <svg width="12" height="12" viewBox="0 0 10 10" fill="currentColor"><path d="M4 1L8 5L4 9L3.3 8.3L6.6 5L3.3 1.7L4 1Z" /></svg>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: uniqueLines.length > 5 ? '1fr 1fr' : '1fr', gap: '12px 24px', width: '100%' }}>
                      {uniqueLines.length > 0 ? uniqueLines.map(line => (
                        <Link key={line} to={`/produtos?q=${encodeURIComponent(line)}`} onClick={() => setHoveredCategory(null)} style={{ color: '#475569', fontSize: '14px', textDecoration: 'none', transition: 'color 0.2s', padding: '4px 0' }} onMouseOver={e => e.currentTarget.style.color = 'var(--color-navy-900)'} onMouseOut={e => e.currentTarget.style.color = '#475569'}>
                          {line}
                        </Link>
                      )) : (
                        <span style={{ color: '#94A3B8', fontSize: '14px' }}>Nenhuma linha cadastrada internamente.</span>
                      )}
                    </div>

                    {/* View all shortcut */}
                    <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', width: '100%' }}>
                      <Link to={`/produtos?q=${encodeURIComponent(cat)}`} onClick={() => setHoveredCategory(null)} style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-900)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Ver todo o catálogo <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M4 1L8 5L4 9L3.3 8.3L6.6 5L3.3 1.7L4 1Z" /></svg></Link>
                    </div>
                  </div>

                  {/* Right Column: Product Featured Carousel */}
                  {currentProduct && (
                    <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '16px', position: 'relative', border: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-navy-900)', background: 'white', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>Produto em Destaque</span>
                        {catProducts.length > 1 && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={(e) => handlePrevProduct(cat, catProducts.length, e)} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-navy-900)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F1F5F9'} onMouseOut={e => e.currentTarget.style.background = 'white'}><ChevronLeft size={16} /></button>
                            <button onClick={(e) => handleNextProduct(cat, catProducts.length, e)} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-navy-900)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#F1F5F9'} onMouseOut={e => e.currentTarget.style.background = 'white'}><ChevronRight size={16} /></button>
                          </div>
                        )}
                      </div>

                      <Link to={`/produtos/${currentProduct.id}`} onClick={() => setHoveredCategory(null)} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '100%', height: '180px', backgroundImage: `url("${currentProduct.image_url || '/img-porta.png'}")`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.02)' }}></div>

                        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                          <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', marginBottom: '8px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '38px' }}>{currentProduct.name}</h4>
                          <div style={{ display: 'flex', gap: '2px', color: '#FDBA74', marginBottom: '12px' }}>
                            <Star size={14} fill="currentColor" />
                            <Star size={14} fill="currentColor" />
                            <Star size={14} fill="currentColor" />
                            <Star size={14} fill="currentColor" />
                            <Star size={14} fill="currentColor" />
                            <span style={{ fontSize: '11px', color: '#64748B', marginLeft: '4px', fontWeight: 600 }}>(+50)</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '8px', width: '100%', border: '1px solid #E2E8F0' }}>
                            <span style={{ fontSize: '11px', color: '#64748B', marginBottom: '2px' }}>A partir de</span>
                            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-navy-900)' }}>R$ {Number(currentProduct.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>no Pix ou Boleto</span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )}

                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
