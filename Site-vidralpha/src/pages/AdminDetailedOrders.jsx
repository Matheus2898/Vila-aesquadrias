import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import {
    Calendar, CreditCard, PieChart, FileText, Printer, RefreshCw, Edit,
    XCircle, CheckCircle, MapPin, Phone, User, Package, Loader2, ArrowLeft,
    MoreHorizontal, ChevronRight, Clock, DollarSign
} from 'lucide-react'
import { fmtCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function AdminDetailedOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchDeliveredOrders()
    }, [])

    async function fetchDeliveredOrders() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('status', 'delivered')
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Erro ao buscar pedidos detalhados:', error)
            toast.error('Erro ao carregar pedidos')
        } finally {
            setLoading(false)
        }
    }

    // eslint-disable-next-line no-unused-vars
    const ActionIcon = ({ Icon: IconComponent, label, color = '#64748B' }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, minWidth: '70px', cursor: 'pointer' }} onClick={() => toast.success(`${label} acionado`)}>
            <div style={{
                width: '44px', height: '44px', borderRadius: '50%', border: '1.5px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: color,
                transition: 'all 0.2s', background: 'white'
            }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-navy-600)'; e.currentTarget.style.background = '#F8FAFC'; }}>
                <IconComponent size={20} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.2px', textAlign: 'center' }}>{label}</span>
        </div>
    )

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-navy-700)" />
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Carregando pedidos detalhados...</span>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '60px' }}>

            {/* Header com Voltar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/admin')}
                        style={{
                            width: '40px', height: '40px', borderRadius: '12px', border: '1px solid #E2E8F0',
                            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#64748B', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', margin: 0 }}>
                            Pedidos Prontos
                        </h1>
                        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
                            Visualização detalhada de entregas e finalização de serviços
                        </p>
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div style={{
                    background: 'white', borderRadius: '24px', padding: '60px', textAlign: 'center',
                    border: '1px dashed #E2E8F0', color: '#94A3B8'
                }}>
                    <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Nenhum pedido entregue encontrado no momento.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
                    {orders.map(order => (
                        <div key={order.id} style={{
                            background: 'white', borderRadius: '24px', border: '1px solid #F1F5F9',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', overflow: 'hidden',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            {/* Card Header */}
                            <div style={{ padding: '24px 28px', borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#1E293B', letterSpacing: '0.5px', margin: 0, textTransform: 'uppercase' }}>
                                    Pedido #{String(order.id).slice(-6).toUpperCase()}
                                </h3>
                                <span style={{
                                    background: '#ECFDF5', color: '#10B981', padding: '4px 12px',
                                    borderRadius: '99px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase'
                                }}>Entregue</span>
                            </div>

                            {/* Card Content - Info */}
                            <div style={{ padding: '24px 28px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                                    {/* Coluna 1: Cliente & Endereço */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <User size={16} color="#94A3B8" style={{ marginTop: '2px' }} />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Cliente</span>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{order.guest_name || 'Usuário'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <MapPin size={16} color="#94A3B8" style={{ marginTop: '2px' }} />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Local da Obra</span>
                                                <span style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.4 }}>{order.notes || 'Endereço não informado'}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <Phone size={16} color="#94A3B8" style={{ marginTop: '2px' }} />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Contato</span>
                                                <span style={{ fontSize: '13px', color: '#64748B' }}>{order.guest_phone || '(00) 00000-0000'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Coluna 2: Detalhes do Projeto */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <FileText size={16} color="#94A3B8" style={{ marginTop: '2px' }} />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Orçamento</span>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>Ref: #{String(order.id).slice(0, 4)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <DollarSign size={16} color="#10B981" style={{ marginTop: '2px' }} />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Valor do Contrato</span>
                                                <span style={{ fontSize: '18px', fontWeight: 900, color: '#10B981' }}>{fmtCurrency(order.total)}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                            <Clock size={16} color="#94A3B8" style={{ marginTop: '2px' }} />
                                            <div>
                                                <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8' }}>Data Entrega</span>
                                                <span style={{ fontSize: '13px', color: '#64748B' }}>{new Date(order.updated_at).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sub-header: Ações Rápidas */}
                                <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ height: '1px', flex: 1, background: '#F1F5F9' }} />
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase' }}>Ações Rápidas</span>
                                    <div style={{ height: '1px', flex: 1, background: '#F1F5F9' }} />
                                </div>

                                {/* Grid de Ícones de Ação */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between' }}>
                                    <ActionIcon Icon={Calendar} label="Reagendar" />
                                    <ActionIcon Icon={CreditCard} label="Pagamentos" />
                                    <ActionIcon Icon={PieChart} label="Custos" />
                                    <ActionIcon Icon={FileText} label="Contrato" />
                                    <ActionIcon Icon={Printer} label="Impressões" />
                                    <ActionIcon Icon={RefreshCw} label="Etapa" />
                                    <ActionIcon Icon={Edit} label="Editar" />
                                </div>
                            </div>

                            {/* Card Footer Actions */}
                            <div style={{ padding: '24px 28px', background: '#F8FAFC', display: 'flex', gap: '12px' }}>
                                <button style={{
                                    flex: 1, padding: '12px', border: '1.5px solid #E2E8F0', borderRadius: '12px',
                                    background: 'white', color: '#64748B', fontWeight: 700, fontSize: '13px',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }} onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                    Cancelar Pedido
                                </button>
                                <button style={{
                                    flex: 1.5, padding: '12px', border: 'none', borderRadius: '12px',
                                    background: 'var(--color-navy-900)', color: 'white', fontWeight: 700, fontSize: '13px',
                                    cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(15,23,42,0.15)'
                                }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                                    Concluir e Arquivar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
