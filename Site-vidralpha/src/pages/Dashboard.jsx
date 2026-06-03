import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import {
  Loader2, Package, Clock, Hammer, CircleCheck,
  Truck, ShoppingCart, CalendarClock, ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

// ─── Badge de Status de Produção ──────────────────────────────────────────────

function ProducaoBadge({ status }) {
  const map = {
    'Pendente':     { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', icon: <Clock size={12} />,       label: 'Pendente' },
    'Em Produção':  { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', icon: <Hammer size={12} />,      label: 'Em Produção' },
    'Concluída':    { bg: '#ECFDF5', color: '#15803D', border: '#A7F3D0', icon: <CircleCheck size={12} />, label: 'Concluído' },
  }
  const s = map[status] || map['Pendente']
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      padding: '4px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 700,
    }}>
      {s.icon} {s.label}
    </span>
  )
}

// ─── Timeline Visual do Pedido ─────────────────────────────────────────────────

function OrderTimeline({ status }) {
  const steps = [
    { key: 'Pendente',    label: 'Recebido',    icon: <Package size={14} /> },
    { key: 'Em Produção', label: 'Em Produção', icon: <Hammer size={14} /> },
    { key: 'Concluída',   label: 'Pronto p/ Coleta', icon: <Truck size={14} /> },
  ]
  const activeIndex = steps.findIndex(s => s.key === status)
  const currentIndex = activeIndex === -1 ? 0 : activeIndex

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, width: '100%', padding: '8px 0' }}>
      {steps.map((step, i) => {
        const done = i <= currentIndex
        const isActive = i === currentIndex
        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '64px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: done ? (isActive ? 'var(--color-navy-900)' : '#ECFDF5') : '#F1F5F9',
                border: `2px solid ${done ? (isActive ? 'var(--color-navy-900)' : '#A7F3D0') : '#E2E8F0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done ? (isActive ? 'white' : '#15803D') : '#94A3B8',
                transition: 'all 0.3s',
                boxShadow: isActive ? '0 0 0 4px rgba(15,23,42,0.08)' : 'none'
              }}>
                {step.icon}
              </div>
              <span style={{
                fontSize: '10px', fontWeight: done ? 700 : 500,
                color: done ? (isActive ? 'var(--color-navy-900)' : '#15803D') : '#94A3B8',
                textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap'
              }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: '2px', margin: '-18px 4px 0',
                background: i < currentIndex ? '#A7F3D0' : '#E2E8F0',
                transition: 'background 0.3s'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Card de Pedido (Mobile/Desktop) ─────────────────────────────────────────

function OrderCard({ order }) {
  const status = order.status_producao || 'Pendente'
  return (
    <div style={{
      background: 'white', borderRadius: '20px',
      border: '1px solid #E8EEF4', padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: '20px',
      transition: 'box-shadow 0.2s'
    }}>
      {/* Header do card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{
            fontSize: '11px', fontFamily: 'monospace', background: '#F1F5F9',
            color: '#475569', padding: '3px 8px', borderRadius: '6px',
            display: 'inline-block', marginBottom: '6px', fontWeight: 700
          }}>
            #{String(order.id).slice(-6).toUpperCase()}
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8' }}>
            Realizado em {formatDate(order.created_at)}
          </div>
        </div>
        <ProducaoBadge status={status} />
      </div>

      {/* Timeline */}
      <OrderTimeline status={status} />

      {/* Rodapé */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '10px',
        borderTop: '1px solid #F1F5F9', paddingTop: '16px'
      }}>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {order.schedule_at && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
              <CalendarClock size={14} color="#64748B" />
              <span>Coleta: <strong>{formatDate(order.schedule_at)}</strong></span>
            </div>
          )}
          {order.total_price != null && (
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
              R$ {Number(order.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
        {status === 'Concluída' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: '#ECFDF5', color: '#15803D',
            padding: '6px 12px', borderRadius: '999px',
            fontSize: '12px', fontWeight: 700
          }}>
            <Truck size={13} /> Aguardando coleta
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Tenta buscar da tabela orders
      let { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fallback para quotes se orders não existir
      if (error?.code === '42P01') {
        const fb = await supabase
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false })
        data = (fb.data || []).map(q => ({
          ...q,
          status_producao: q.status === 'approved' ? 'Concluída' : (q.status === 'analyzing' ? 'Em Produção' : 'Pendente')
        }))
      }

      setOrders(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const stats = {
    total: orders.length,
    pendente: orders.filter(o => !o.status_producao || o.status_producao === 'Pendente').length,
    producao: orders.filter(o => o.status_producao === 'Em Produção').length,
    concluida: orders.filter(o => o.status_producao === 'Concluída').length,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--color-navy-700)" />
      </div>
    )
  }

  return (
    <div style={{ padding: '60px 0', minHeight: '80vh' }}>
      <div className="container-ds" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <h1 className="t-h1" style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '8px', color: 'var(--color-navy-900)' }}>
            Meus Pedidos
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Acompanhe em tempo real o status de produção dos seus pedidos.
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {[
            { label: 'Total',        value: stats.total,    icon: <ShoppingCart size={18} />, color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
            { label: 'Pendentes',    value: stats.pendente,  icon: <Clock size={18} />,        color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
            { label: 'Em Produção',  value: stats.producao,  icon: <Hammer size={18} />,       color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
            { label: 'Prontos',      value: stats.concluida, icon: <CircleCheck size={18} />,  color: '#16A34A', bg: '#ECFDF5', border: '#A7F3D0' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: kpi.bg, border: `1px solid ${kpi.border}`,
              borderRadius: '16px', padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: kpi.color,
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
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

        {/* Lista de pedidos */}
        {orders.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: '20px', border: '1px solid #E8E8E0',
            padding: '80px 32px', textAlign: 'center'
          }}>
            <Package size={48} style={{ margin: '0 auto 16px', color: '#CBD5E1' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
              Nenhum pedido encontrado.
            </p>
            <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '28px' }}>
              Quando você realizar uma compra, ela aparecerá aqui com o status de produção em tempo real.
            </p>
            <Link to="/produtos" className="btn-ds btn-primary btn-round" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px' }}>
              <ShoppingCart size={18} /> Ver Catálogo
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
