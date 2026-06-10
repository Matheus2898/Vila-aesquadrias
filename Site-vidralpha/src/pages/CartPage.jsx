import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { supabase } from '../utils/supabaseClient';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck, Ticket, Truck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CartPage() {
    const { items, removeFromCart, updateQty, totalItems, totalPrice } = useCart();
    const [coupon, setCoupon] = useState('');

    const [cep, setCep] = useState('');
    const [freightLoading, setFreightLoading] = useState(false);
    const [freightResult, setFreightResult] = useState(null);
    const [selectedFreight, setSelectedFreight] = useState(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    const fmt = (v) => Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Final Total with Freight
    const cartTotalWithFreight = totalPrice + (selectedFreight?.price && selectedFreight.price !== '-' ? Number(selectedFreight.price) : 0);

    // Calculate Total Weight for Freight
    const totalWeight = items.reduce((acc, item) => {
        const measure = item.measures?.find(m => m.size === item.options?.size);
        const weight = measure?.weight ? Number(measure.weight) : 0;
        return acc + (weight * item.quantity);
    }, 0);

    async function handleCalculateFreight() {
        if (cep.length !== 8) {
            toast.error("Digite um CEP válido com 8 números.");
            return;
        }
        setFreightLoading(true);
        setFreightResult(null);

        try {
            const { data, error } = await supabase.functions.invoke('lalamove-quote', {
                body: { destinationCep: cep, weight: totalWeight || 1 } // Fallback weight if 0
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

    async function handleCheckout() {
        if (!selectedFreight) {
            toast.error("Por favor, calcule e selecione o frete primeiro.");
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast.error("Você precisa estar logado para comprar.");
            return;
        }

        setCheckoutLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('lalamove-checkout', {
                body: {
                    itens: items,
                    enderecoEntrega: {
                        lat: "-23.5505",
                        lng: "-46.6333",
                        address: `CEP ${cep}`,
                        cep: cep,
                    },
                    // Envia o frete já selecionado pelo usuário
                    freteInfo: {
                        vehicle: selectedFreight.vehicle,
                        price: selectedFreight.price,
                        time: selectedFreight.time,
                        quotationId: selectedFreight.quotationId,
                    },
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            if (data && data.preferenceId) {
                // Usa a URL de init_point retornada pelo backend (produção ou sandbox)
                const paymentUrl = data.checkoutUrl || data.sandboxUrl ||
                    `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${data.preferenceId}`;
                window.location.href = paymentUrl;
            } else {
                throw new Error("Não foi possível gerar o pagamento.");
            }
        } catch (err) {
            console.error("Erro no checkout:", err);
            toast.error(err.message || "Erro ao processar checkout. Tente novamente.");
        } finally {
            setCheckoutLoading(false);
        }
    }

    if (items.length === 0) {
        return (
            <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', background: '#F8FAFC', padding: '48px', borderRadius: '24px', border: '1px solid #E2E8F0' }}>
                    <ShoppingBag size={64} style={{ margin: '0 auto 24px', opacity: 0.2, color: 'var(--color-navy-900)' }} />
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-navy-900)', marginBottom: '16px' }}>Seu carrinho está vazio</h2>
                    <p style={{ color: '#64748B', marginBottom: '32px' }}>Parece que você ainda não adicionou nenhum item ao seu carrinho de compras.</p>
                    <Link
                        to="/produtos"
                        className="btn-ds btn-primary"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '14px 32px',
                            borderRadius: '12px', textDecoration: 'none', fontWeight: 700,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Explorar Produtos <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#FFFFFF', fontFamily: 'var(--font-body)', paddingBottom: '100px' }}>

            {/* ─── BANNER HEADER (Matching Profile) ─── */}
            <div className="cart-banner" style={{
                background: 'var(--color-navy-900)',
                padding: 'clamp(60px, 15vw, 120px) 0 80px',
                color: 'white',
                textAlign: 'center'
            }}>
                <div className="container-ds" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
                    <h1 style={{ fontSize: 'clamp(28px, 6vw, 40px)', fontWeight: 900, marginBottom: '8px', color: 'white', textTransform: 'none', letterSpacing: 'normal' }}>
                        Meu Carrinho
                    </h1>
                    <p style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: 'rgba(255,255,255,0.7)' }}>
                        Você tem <span style={{ color: 'var(--color-amber-400)', fontWeight: 700 }}>{totalItems} item(s)</span> no seu carrinho.
                    </p>
                </div>
            </div>

            <div className="container" style={{ marginTop: '0px', paddingTop: '40px', paddingLeft: '20px', paddingRight: '20px', position: 'relative', zIndex: 10 }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth <= 1024 ? '1fr' : '1fr 380px',
                    gap: '40px',
                    alignItems: 'flex-start'
                }}>

                    {/* ─── LISTA DE PRODUTOS ─── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>

                        {/* Cabeçalho da Tabela (Desktop) */}
                        {window.innerWidth > 768 && (
                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr 120px 140px 120px',
                                padding: '0 0 20px 0', borderBottom: '2px solid #F1F5F9',
                                fontSize: '13px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px'
                            }}>
                                <div>Produto</div>
                                <div style={{ textAlign: 'center' }}>Preço</div>
                                <div style={{ textAlign: 'center' }}>Quantidade</div>
                                <div style={{ textAlign: 'right' }}>Subtotal</div>
                            </div>
                        )}

                        {items.map((item) => (
                            <div key={item.cart_id} style={{
                                display: 'grid',
                                gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 120px 140px 120px',
                                alignItems: 'center',
                                padding: '24px 0',
                                borderBottom: '1px solid #F1F5F9',
                                gap: window.innerWidth <= 768 ? '16px' : '0'
                            }}>
                                {/* Produto Info */}
                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => removeFromCart(item.cart_id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', transition: 'color 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.color = '#EF4444'}
                                        onMouseOut={e => e.currentTarget.style.color = '#CBD5E1'}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                    <div style={{ width: '90px', height: '90px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0 }}>
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src = '/img-porta.png'} />
                                    </div>
                                    <div style={{ minWidth: 0 }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#1E293B', margin: '0 0 4px 0' }}>{item.name}</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                            {item.options?.variant_sku && <span style={{ padding: '2px 8px', background: '#F1F5F9', borderRadius: '4px', fontSize: '10px', fontWeight: 700, color: '#64748B', fontFamily: 'monospace' }}>SKU: {item.options.variant_sku}</span>}
                                            {item.options?.size && <span style={{ fontSize: '12px', color: '#64748B' }}>{item.options.size}</span>}
                                            {item.options?.color && <span style={{ fontSize: '12px', color: '#64748B' }}>• {item.options.color}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Preço Unitário */}
                                <div style={{ textAlign: 'center', color: '#475569', fontWeight: 600 }}>
                                    {window.innerWidth <= 768 && <span style={{ fontSize: '12px', color: '#94A3B8', marginRight: '8px' }}>Preço:</span>}
                                    R$ {fmt(item.price)}
                                </div>

                                {/* Quantidade Control */}
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '12px',
                                        background: '#F8FAFC', padding: '6px 12px', borderRadius: '10px', border: '1px solid #E2E8F0'
                                    }}>
                                        <button onClick={() => updateQty(item.cart_id, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}><Minus size={14} /></button>
                                        <span style={{ fontWeight: 800, fontSize: '14px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button onClick={() => updateQty(item.cart_id, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 4 }}><Plus size={14} /></button>
                                    </div>
                                </div>

                                {/* Subtotal Item */}
                                <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-navy-900)', fontSize: '16px' }}>
                                    {window.innerWidth <= 768 && <span style={{ fontSize: '12px', color: '#94A3B8', marginRight: '8px', fontWeight: 600 }}>Subtotal:</span>}
                                    R$ {fmt(item.price * item.quantity)}
                                </div>
                            </div>
                        ))}

                        {/* Ações Inferiores */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '20px' }}>
                            <Link to="/produtos" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontWeight: 600, textDecoration: 'none', fontSize: '14px' }}>
                                <ArrowLeft size={16} /> Continuar Comprando
                            </Link>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ position: 'relative' }}>
                                    <Ticket size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                    <input
                                        type="text"
                                        placeholder="Código do cupom"
                                        value={coupon}
                                        onChange={e => setCoupon(e.target.value)}
                                        style={{
                                            padding: '12px 16px 12px 42px', borderRadius: '10px',
                                            border: '1px solid #E2E8F0', fontSize: '14px', outline: 'none',
                                            width: '180px'
                                        }}
                                    />
                                </div>
                                <button className="btn-ds btn-primary" style={{
                                    padding: '12px 24px', border: 'none',
                                    borderRadius: '10px', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(26, 45, 161, 0.2)'
                                }} onMouseOver={e => { e.target.style.transform = 'translateY(-1px)' }} onMouseOut={e => { e.target.style.transform = 'translateY(0)' }}>
                                    Aplicar Cupom
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ─── RESUMO / TOTAL ─── */}
                    <div style={{
                        background: '#F8FAFC', padding: '32px', borderRadius: '24px',
                        border: '1px solid #E2E8F0', position: 'sticky', top: '120px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.03)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
                            Total do carrinho
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
                                <span style={{ color: '#64748B' }}>Subtotal</span>
                                <span style={{ fontWeight: 700, color: '#1E293B' }}>R$ {fmt(totalPrice)}</span>
                            </div>

                            <div style={{ padding: '16px 0', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>

                                {/* ─── Banner "Calcule o frete para continuar" ─── */}
                                {!selectedFreight && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #FFF7ED, #FFFBEB)',
                                        border: '1.5px dashed #F59E0B',
                                        borderRadius: '10px',
                                        padding: '12px 14px',
                                        marginBottom: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <Truck size={20} color="#D97706" style={{ flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#92400E' }}>
                                                ⚠️ Calcule o frete para continuar
                                            </p>
                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#B45309' }}>
                                                Insira seu CEP abaixo e clique em Calcular
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedFreight && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
                                        border: '1.5px solid #22C55E',
                                        borderRadius: '10px',
                                        padding: '10px 14px',
                                        marginBottom: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        <ShieldCheck size={18} color="#16A34A" style={{ flexShrink: 0 }} />
                                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#15803D' }}>
                                            ✅ Frete selecionado! Clique em Finalizar Compra.
                                        </p>
                                    </div>
                                )}

                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Truck size={16} /> Digite seu CEP
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Seu CEP (apenas números)"
                                        maxLength={8}
                                        value={cep}
                                        onChange={e => setCep(e.target.value.replace(/\D/g, ''))}
                                        style={{
                                            flex: 1, padding: '10px 12px', borderRadius: '8px',
                                            border: !selectedFreight && cep.length === 0 ? '2px solid #F59E0B' : '1px solid #E2E8F0',
                                            fontSize: '14px', outline: 'none',
                                            transition: 'border 0.3s'
                                        }}
                                    />
                                    <button
                                        onClick={handleCalculateFreight}
                                        disabled={freightLoading}
                                        className="btn-ds btn-primary"
                                        style={{
                                            border: 'none',
                                            borderRadius: '8px', padding: '0 16px', cursor: 'pointer',
                                            fontSize: '12px', fontWeight: 700, textTransform: 'uppercase'
                                        }}
                                    >
                                        {freightLoading ? <Loader2 className="animate-spin" size={16} /> : 'Calcular'}
                                    </button>
                                </div>

                                {freightResult && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {freightResult.length > 0 ? (
                                            freightResult.map((res, i) => (
                                                <div 
                                                    key={i} 
                                                    onClick={() => res.price !== '-' && setSelectedFreight(res)}
                                                    style={{ 
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                                                        padding: '10px 12px', borderRadius: '8px', cursor: res.price !== '-' ? 'pointer' : 'default',
                                                        border: selectedFreight === res ? '2px solid var(--color-amber-500)' : '1px solid #E2E8F0',
                                                        background: selectedFreight === res ? '#FFFBEB' : 'white',
                                                        transition: 'all 0.2s'
                                                    }}
                                                >
                                                    <span style={{ fontSize: '13px', fontWeight: selectedFreight === res ? 700 : 600, color: '#1E293B' }}>{res.vehicle || 'Padrão'}</span>
                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-amber-600)' }}>R$ {res.price !== '-' ? fmt(res.price) : '-'}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>Nenhuma opção disponível para este CEP.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', marginTop: '8px' }}>
                                <span style={{ fontWeight: 900, color: '#111827' }}>Total</span>
                                <span style={{ fontWeight: 900, color: 'var(--color-navy-900)' }}>R$ {fmt(cartTotalWithFreight)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={checkoutLoading}
                            className="btn-ds btn-primary"
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                width: '100%', padding: '18px', marginTop: '32px', border: 'none',
                                borderRadius: '14px', textDecoration: 'none', cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                                fontSize: '16px', fontWeight: 800,
                                boxShadow: '0 10px 20px rgba(26, 45, 161, 0.2)',
                                transition: 'all 0.3s',
                                opacity: checkoutLoading ? 0.7 : 1
                            }}
                            onMouseOver={e => { if(!checkoutLoading) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 15px 30px rgba(26, 45, 161, 0.3)' } }}
                            onMouseOut={e => { if(!checkoutLoading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(26, 45, 161, 0.2)' } }}
                        >
                            {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : 'Finalizar Compra'} 
                            {!checkoutLoading && <ArrowRight size={20} />}
                        </button>

                        <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94A3B8', fontSize: '12px' }}>
                            <ShieldCheck size={16} /> Compra 100% Segura
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
