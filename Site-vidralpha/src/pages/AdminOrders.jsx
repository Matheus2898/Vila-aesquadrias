import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import {
    Loader2, Package, Filter, Clock, CheckCircle2, Truck,
    ChevronRight, AlertTriangle, RefreshCw, Search,
    CalendarClock, Hash, User, ShoppingCart, Hammer, CircleCheck,
    X, Info, Trash2
} from 'lucide-react'
import CustomDropdown from '../components/CustomDropdown'
import toast from 'react-hot-toast'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    })
}

function formatDateTime(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function getDaysUntil(dateStr) {
    if (!dateStr) return null
    const diff = new Date(dateStr) - new Date()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── Badge de Status de Produção ──────────────────────────────────────────────

function ProducaoBadge({ status }) {
    const map = {
        'Pendente': { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', icon: <Clock size={12} /> },
        'Em Produção': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: <Hammer size={12} /> },
        'Concluída': { bg: '#ECFDF5', color: '#15803D', border: '#A7F3D0', icon: <CircleCheck size={12} /> },
    }
    const s = map[status] || map['Pendente']
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: s.bg, color: s.color,
            border: `1px solid ${s.border}`,
            padding: '4px 10px', borderRadius: '999px',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.2px',
            whiteSpace: 'nowrap'
        }}>
            {s.icon} {status || 'Pendente'}
        </span>
    )
}

// ─── Badge de Coleta ──────────────────────────────────────────────────────────

function ColetaBadge({ scheduleAt }) {
    const days = getDaysUntil(scheduleAt)
    if (days === null) return <span style={{ color: '#94A3B8', fontSize: '12px' }}>Sem data</span>
    const urgent = days <= 1
    const soon = days <= 3
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: urgent ? '#FEF2F2' : (soon ? '#FFFBEB' : '#F8FAFC'),
            color: urgent ? '#B91C1C' : (soon ? '#92400E' : '#475569'),
            border: `1px solid ${urgent ? '#FCA5A5' : (soon ? '#FCD34D' : '#E2E8F0')}`,
            padding: '4px 10px', borderRadius: '999px',
            fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap'
        }}>
            <Truck size={11} />
            {formatDate(scheduleAt)}
            {urgent && ' ⚠️'}
        </span>
    )
}

// ─── Modal de Detalhes do Pedido ──────────────────────────────────────────────

function OrderDetailModal({ order, onClose, onStatusChange, onDeleteOrder }) {
    const [isSaving, setIsSaving] = useState(false)
    const [showAnticipatePrompt, setShowAnticipatePrompt] = useState(false)

    if (!order) return null

    const items = order.items || []
    const scheduleDate = order.schedule_at ? new Date(order.schedule_at) : null
    const isOnSchedule = scheduleDate && scheduleDate >= new Date()

    const handleProducaoConcluida = async () => {
        if (isOnSchedule) {
            setIsSaving(true)
            await onStatusChange(order.id, 'Concluída', false)
            setIsSaving(false)
            onClose()
        } else {
            setShowAnticipatePrompt(true)
        }
    }

    const handleAnticipate = async (shouldAnticipate) => {
        setIsSaving(true)
        await onStatusChange(order.id, 'Concluída', shouldAnticipate)
        setIsSaving(false)
        onClose()
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
            <div
                data-lenis-prevent="true"
                onWheel={e => e.stopPropagation()}
                style={{
                    background: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '640px',
                    maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                    display: 'flex', flexDirection: 'column'
                }}
                className="custom-scrollbar"
            >
                <div style={{
                    padding: '28px 32px 20px', borderBottom: '1px solid #F1F5F9',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <Package size={20} color="#0F172A" />
                            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                                Pedido #{String(order.id).slice(-6).toUpperCase()}
                            </h2>
                        </div>
                        <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                            Realizado em {formatDateTime(order.created_at)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px', height: '36px', borderRadius: '50%', border: '1px solid #E2E8F0',
                            background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#64748B', flexShrink: 0
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <section style={{ background: '#F8FAFC', borderRadius: '16px', padding: '18px 20px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '1px', marginBottom: '12px' }}>
                            Cliente
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: 'var(--color-navy-900)', color: 'var(--color-amber-500)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '16px', flexShrink: 0
                            }}>
                                {(order.profiles?.full_name || 'C').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>{order.profiles?.full_name || '—'}</div>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>{order.profiles?.email || '—'}</div>
                            </div>
                        </div>
                    </section>

                    <section style={{ background: '#F8FAFC', borderRadius: '16px', padding: '18px 20px', border: '1px solid #E2E8F0' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '1px', marginBottom: '14px' }}>
                            Logística Lalamove
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', fontWeight: 600 }}>Data de Coleta</div>
                                <ColetaBadge scheduleAt={order.schedule_at} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', fontWeight: 600 }}>Order ID Lalamove</div>
                                <span style={{ fontSize: '12px', fontFamily: 'monospace', background: '#E2E8F0', padding: '4px 8px', borderRadius: '6px', color: '#334155' }}>
                                    {order.lalamove_order_id || 'Não gerado'}
                                </span>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', fontWeight: 600 }}>Status Produção</div>
                                <ProducaoBadge status={order.status_producao} />
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94A3B8', marginBottom: '4px', fontWeight: 600 }}>Valor Total</div>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                                    {order.total != null
                                        ? `R$ ${Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                        : (order.total_price != null ? `R$ ${Number(order.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—')}
                                </span>
                            </div>
                        </div>
                    </section>

                    {items.length > 0 && (
                        <section>
                            <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '1px', marginBottom: '12px' }}>
                                Itens do Pedido ({items.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {items.map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '8px',
                                                background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                <ShoppingCart size={14} color="#64748B" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '13px', color: '#0F172A' }}>
                                                    {item.product_name || item.name || 'Produto'}
                                                </div>
                                                {item.specs && <div style={{ fontSize: '11px', color: '#94A3B8' }}>{item.specs}</div>}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: '#64748B' }}>Qtd: <strong>{item.quantity || item.qty || 1}</strong></div>
                                            {item.price != null && (
                                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                                                    R$ {Number(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {showAnticipatePrompt && (
                        <div style={{
                            background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '16px', padding: '18px 20px'
                        }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                                <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400E' }}>Produção adiantada!</div>
                                    <div style={{ fontSize: '13px', color: '#B45309', marginTop: '4px' }}>
                                        A data de coleta já passou ou está muito próxima. Deseja antecipar a coleta na Lalamove para amanhã às 09:00?
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleAnticipate(false)}
                                    disabled={isSaving}
                                    style={{
                                        flex: 1, padding: '10px', background: 'white', border: '1px solid #D97706',
                                        color: '#92400E', borderRadius: '10px', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                                    }}
                                >
                                    Não, manter data original
                                </button>
                                <button
                                    onClick={() => handleAnticipate(true)}
                                    disabled={isSaving}
                                    style={{
                                        flex: 1, padding: '10px', background: '#D97706', border: 'none',
                                        color: 'white', borderRadius: '10px', fontWeight: 700, fontSize: '13px',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                                    Sim, antecipar coleta
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!showAnticipatePrompt && (
                    <div style={{
                        padding: '20px 32px', borderTop: '1px solid #F1F5F9', flexShrink: 0,
                        display: 'flex', gap: '12px', justifyContent: 'space-between', background: '#FAFAFA',
                        borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px'
                    }}>
                        <button
                            onClick={() => onDeleteOrder(order.id)}
                            style={{
                                padding: '12px 20px', background: '#FEF2F2', color: '#B91C1C',
                                border: '1px solid #FECACA', borderRadius: '12px', fontWeight: 700,
                                fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <Trash2 size={15} /> Excluir
                        </button>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {order.status_producao !== 'Em Produção' && order.status_producao !== 'Concluída' && (
                            <button
                                onClick={() => onStatusChange(order.id, 'Em Produção', false).then(onClose)}
                                style={{
                                    padding: '12px 20px', background: '#EFF6FF', color: '#1D4ED8',
                                    border: '1px solid #BFDBFE', borderRadius: '12px', fontWeight: 700,
                                    fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
                                }}
                            >
                                <Hammer size={15} /> Iniciar Produção
                            </button>
                        )}
                        {order.status_producao !== 'Concluída' && (
                            <button
                                onClick={handleProducaoConcluida}
                                disabled={isSaving}
                                style={{
                                    padding: '12px 24px', background: 'var(--color-navy-900)', color: 'white',
                                    border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '13px',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    boxShadow: '0 4px 12px rgba(15,23,42,0.2)'
                                }}
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CircleCheck size={15} />}
                                Produção Concluída
                            </button>
                        )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [search, setSearch] = useState('')
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [refreshing, setRefreshing] = useState(false)

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Atenção: Excluir este pedido é uma ação irreversível. Deseja continuar?')) return;
        const { error } = await supabase.from('orders').delete().eq('id', orderId)
        if (error) {
            toast.error('Erro ao excluir pedido: ' + error.message)
        } else {
            toast.success('Pedido excluído com sucesso!')
            setOrders(prev => prev.filter(o => o.id !== orderId))
            setSelectedOrder(null)
        }
    }

    const fetchOrders = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)

        try {
            let { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .neq('status', 'pending')
                .order('created_at', { ascending: false })

            if (ordersError?.code === '42P01') {
                const { data: quotesData, error: quotesError } = await supabase
                    .from('quotes')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (!quotesError) ordersData = quotesData
            } else if (ordersError) {
                toast.error('Erro ao carregar pedidos: ' + ordersError.message)
                ordersData = []
            }

            if (!ordersData || ordersData.length === 0) {
                setOrders([])
                return
            }

            const userIds = [...new Set(ordersData.map(o => o.user_id).filter(Boolean))]

            let profilesMap = {}
            if (userIds.length > 0) {
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, email')
                    .in('id', userIds)

                if (profilesData) {
                    profilesData.forEach(p => { profilesMap[p.id] = p })
                }
            }

            const merged = ordersData.map(o => ({
                ...o,
                profiles: profilesMap[o.user_id] || null
            }))

            setOrders(merged)
        } catch (err) {
            console.error(err)
            toast.error('Erro inesperado ao carregar pedidos.')
            setOrders([])
        } finally {
            if (!silent) setLoading(false)
            else setRefreshing(false)
        }
    }, [])

    useEffect(() => { fetchOrders() }, [fetchOrders])

    useEffect(() => {
        const channel = supabase
            .channel('admin-orders-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                () => {
                    fetchOrders(true)
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [fetchOrders])

    const handleStatusChange = async (orderId, newProducaoStatus, anticipate) => {
        try {
            if (anticipate) {
                const { data: edtData, error: edtError } = await supabase.functions.invoke(
                    'lalamove-edit-order',
                    { body: { orderId } }
                )

                if (edtError || !edtData?.success) {
                    const motivo = edtData?.error ?? edtError?.message ?? 'Erro desconhecido'
                    toast.error(`⚠️ Status atualizado, mas falha ao antecipar coleta na Lalamove: ${motivo}`)
                } else {
                    const novaDataColeta = edtData?.novaDataColeta
                    if (novaDataColeta) {
                        setOrders(prev => prev.map(o =>
                            o.id === orderId ? { ...o, schedule_at: novaDataColeta } : o
                        ))
                    }
                }

                await supabase
                    .from('orders')
                    .update({ status_producao: newProducaoStatus })
                    .eq('id', orderId)

            } else {
                const { error } = await supabase
                    .from('orders')
                    .update({ status_producao: newProducaoStatus })
                    .eq('id', orderId)

                if (error) {
                    await supabase.from('quotes').update({ status: newProducaoStatus }).eq('id', orderId)
                }
            }

            toast.success(
                newProducaoStatus === 'Concluída'
                    ? (anticipate ? '✅ Produção concluída e coleta antecipada na Lalamove!' : '✅ Produção marcada como concluída!')
                    : '🔧 Pedido marcado como Em Produção!'
            )

            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status_producao: newProducaoStatus } : o
            ))

        } catch (err) {
            console.error(err)
            toast.error('Erro inesperado ao atualizar o pedido.')
        }
    }

    const filtered = orders.filter(o => {
        const matchFilter = filter === 'all' || (o.status_producao || 'Pendente') === filter
        const q = search.toLowerCase()
        const matchSearch = !q
            || o.profiles?.full_name?.toLowerCase().includes(q)
            || o.profiles?.email?.toLowerCase().includes(q)
            || String(o.id).toLowerCase().includes(q)
            || (o.lalamove_order_id || '').toLowerCase().includes(q)
        return matchFilter && matchSearch
    })

    const stats = {
        total: orders.length,
        pendente: orders.filter(o => !o.status_producao || o.status_producao === 'Pendente').length,
        producao: orders.filter(o => o.status_producao === 'Em Produção').length,
        concluida: orders.filter(o => o.status_producao === 'Concluída').length,
    }

    return (
        <div>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                marginBottom: '28px', gap: '20px', flexWrap: 'wrap'
            }}>
                <div>
                    <h1 className="t-h1" style={{ fontSize: 'clamp(20px, 4vw, 30px)', marginBottom: '4px' }}>
                        Gestão de Pedidos
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '14px' }}>
                        Controle de produção e logística de coleta.
                    </p>
                </div>
                <button
                    onClick={() => fetchOrders(true)}
                    disabled={refreshing}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '10px 18px', background: '#F1F5F9', border: '1px solid #E2E8F0',
                        borderRadius: '10px', color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                    }}
                >
                    <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
                    Atualizar
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {[
                    { label: 'Total de Pedidos', value: stats.total, icon: <Package size={18} />, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
                    { label: 'Pendentes', value: stats.pendente, icon: <Clock size={18} />, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
                    { label: 'Em Produção', value: stats.producao, icon: <Hammer size={18} />, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
                    { label: 'Concluídos', value: stats.concluida, icon: <CircleCheck size={18} />, color: '#16A34A', bg: '#ECFDF5', border: '#A7F3D0' },
                ].map(kpi => (
                    <div key={kpi.label} style={{
                        background: kpi.bg, border: `1px solid ${kpi.border}`,
                        borderRadius: '16px', padding: '18px 20px',
                        display: 'flex', alignItems: 'center', gap: '14px'
                    }}>
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '12px',
                            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: kpi.color, boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                        }}>
                            {kpi.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>{kpi.value}</div>
                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px', fontWeight: 500 }}>{kpi.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center'
            }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, e-mail ou ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '11px 14px 11px 38px', borderRadius: '12px',
                            border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px',
                            background: 'white', color: '#0F172A', boxSizing: 'border-box'
                        }}
                    />
                </div>
                <div style={{ minWidth: '220px' }}>
                    <CustomDropdown
                        value={filter}
                        onChange={setFilter}
                        options={[
                            { value: 'all', label: 'Todos os Status', icon: <Filter size={15} /> },
                            { value: 'Pendente', label: 'Pendentes', icon: <Clock size={15} color="#D97706" /> },
                            { value: 'Em Produção', label: 'Em Produção', icon: <Hammer size={15} color="#2563EB" /> },
                            { value: 'Concluída', label: 'Concluídos', icon: <CircleCheck size={15} color="#16A34A" /> },
                        ]}
                    />
                </div>
            </div>

            <div style={{
                backgroundColor: 'white', borderRadius: '16px',
                border: '1px solid #E8EEF4', overflow: 'auto',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: '#94A3B8' }} />
                        <p style={{ color: '#94A3B8', marginTop: '12px', fontSize: '14px' }}>Carregando pedidos...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#94A3B8' }}>
                        <Package size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                        <p style={{ fontWeight: 600, fontSize: '15px' }}>Nenhum pedido encontrado.</p>
                        <p style={{ fontSize: '13px', marginTop: '4px' }}>Tente ajustar o filtro ou a busca.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '780px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#FAFBFC' }}>
                                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={12} /> Pedido</div>
                                </th>
                                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={12} /> Cliente</div>
                                </th>
                                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarClock size={12} /> Coleta Prevista</div>
                                </th>
                                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Produção
                                </th>
                                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Valor
                                </th>
                                <th style={{ padding: '14px 20px', color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(order => (
                                <tr
                                    key={order.id}
                                    style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#FAFBFD'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#334155', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', display: 'inline-block' }}>
                                            #{String(order.id).slice(-6).toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                                            {formatDate(order.created_at)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                                            {order.profiles?.full_name || 'Cliente não identificado'}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                                            {order.profiles?.email}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <ColetaBadge scheduleAt={order.schedule_at} />
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <ProducaoBadge status={order.status_producao || 'Pendente'} />
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                                            {order.total != null
                                                ? `R$ ${Number(order.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                : (order.total_price != null ? `R$ ${Number(order.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : <span style={{ color: '#94A3B8', fontWeight: 400 }}>—</span>)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '8px 14px', background: 'var(--color-navy-900)', color: 'white',
                                                border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700,
                                                cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                        >
                                            Gerenciar <ChevronRight size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onStatusChange={handleStatusChange}
                    onDeleteOrder={handleDeleteOrder}
                />
            )}
        </div>
    )
}
