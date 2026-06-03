import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { Link } from 'react-router-dom'

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQty, totalItems, totalPrice } = useCart()

  if (!isOpen) return null

  const fmt = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(5, 5, 10, 0.55)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(420px, 100vw)',
        background: 'white',
        borderLeft: '1px solid #E8E8E0',
        zIndex: 1000,
        boxShadow: '-24px 0 64px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        fontFamily: 'var(--font-body)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F0F0EA',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#FAFAF8',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingCart size={20} color="var(--color-navy-900)" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#000', margin: 0 }}>
              Meu Carrinho
            </h3>
            {totalItems > 0 && (
              <span style={{
                background: 'var(--color-navy-900)', color: 'white',
                fontSize: '11px', fontWeight: 800,
                width: '20px', height: '20px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{totalItems}</span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              background: '#F0F0EA', border: 'none', cursor: 'pointer',
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#666', transition: 'background 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.background = '#E5E5DD'}
            onMouseOut={e => e.currentTarget.style.background = '#F0F0EA'}
          >
            <X size={16} />
          </button>
        </div>

        {/* Lista de itens */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#AAA' }}>
              <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '15px', fontWeight: 600 }}>Seu carrinho está vazio</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Adicione produtos do catálogo!</p>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  marginTop: '24px', padding: '10px 24px',
                  background: 'var(--color-navy-900)', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer',
                  fontSize: '14px', fontWeight: 700,
                }}
              >
                Ver Catálogo
              </button>
            </div>
          ) : (
            items.map(item => (
              <div key={item.cart_id} style={{
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                padding: '14px', borderRadius: '12px',
                border: '1px solid #F0F0EA', background: '#FAFAF8',
              }}>
                {/* Imagem */}
                <div style={{
                  width: '64px', height: '64px', flexShrink: 0,
                  borderRadius: '8px', overflow: 'hidden',
                  border: '1px solid #E8E8E0', background: '#F5F5F0',
                }}>
                  <img
                    src={item.image}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.src = '/img-porta.png' }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#111', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {item.name}
                  </p>

                  {/* Opções Selecionadas */}
                  <div style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {item.options?.variant_sku && <span style={{ fontSize: '10px', color: '#666', fontFamily: 'monospace', background: '#E5E5DD', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', marginBottom: '2px', letterSpacing: '0.5px' }}>SKU: {item.options.variant_sku}</span>}
                    {item.options?.size && <span style={{ fontSize: '11px', color: '#666' }}>Dimensão: <strong>{item.options.size}</strong></span>}
                    {item.options?.color && <span style={{ fontSize: '11px', color: '#666' }}>Cor: <strong>{item.options.color}</strong></span>}
                    {item.options?.side && <span style={{ fontSize: '11px', color: '#666' }}>Abertura: <strong>{item.options.side}</strong></span>}
                    {item.options?.glass_type && <span style={{ fontSize: '11px', color: '#0369A1' }}>Vidro: <strong>{item.options.glass_type}</strong></span>}
                    {item.options?.glass_thickness && <span style={{ fontSize: '11px', color: '#0369A1' }}>Espessura: <strong>{item.options.glass_thickness}</strong></span>}
                    {item.options?.glass_color && <span style={{ fontSize: '11px', color: '#0369A1' }}>Cor Vidro: <strong>{item.options.glass_color}</strong></span>}
                  </div>

                  <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-navy-900)', margin: '0 0 10px' }}>
                    R$ {fmt(item.price)}
                  </p>

                  {/* Quantidade */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateQty(item.cart_id, -1)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: '1px solid #E5E7EB', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#555',
                      }}
                    >
                      <Minus size={13} />
                    </button>
                    <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.cart_id, 1)}
                      style={{
                        width: '28px', height: '28px', borderRadius: '6px',
                        border: '1px solid #E5E7EB', background: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#555',
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>

                {/* Subtotal + Remover */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                    R$ {fmt(item.price * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeFromCart(item.cart_id)}
                    style={{
                      background: '#FEF2F2', border: 'none', color: '#E11D48',
                      width: '28px', height: '28px', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — Total + CTA */}
        {items.length > 0 && (
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #F0F0EA',
            background: '#FAFAF8',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#000' }}>R$ {fmt(totalPrice)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '14px',
                background: 'var(--color-navy-900)', color: 'white',
                borderRadius: '10px', textDecoration: 'none',
                fontSize: '15px', fontWeight: 800,
                transition: 'all 0.2s', border: 'none', cursor: 'pointer',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#1a1f5a'}
              onMouseOut={e => e.currentTarget.style.background = 'var(--color-navy-900)'}
            >
              Finalizar Compra <ArrowRight size={18} />
            </Link>

            <Link
              to="/carrinho"
              onClick={() => setIsOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '10px', marginTop: '8px',
                background: 'none', color: '#666', border: '1px solid #E5E7EB',
                borderRadius: '10px', textDecoration: 'none',
                fontSize: '13px', fontWeight: 700,
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onMouseOver={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.color = '#000' }}
              onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#666' }}
            >
              Ver Carrinho Completo
            </Link>

            <p style={{ textAlign: 'center', fontSize: '11px', color: '#AAA', marginTop: '10px' }}>
              Frete e outras taxas calculados no checkout
            </p>
          </div>
        )}
      </div>
    </>
  )
}
