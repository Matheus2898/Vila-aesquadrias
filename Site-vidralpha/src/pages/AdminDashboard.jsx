import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import {
  Loader2, Clock,
  ChevronRight, Eye, EyeOff, BarChart2, Receipt, Play, X,
  Download, FileSpreadsheet, CalendarDays, TrendingUp, CheckCircle2
} from 'lucide-react'
import { fmtCurrency } from '../utils/formatters'
import toast from 'react-hot-toast'

// ─── Utilitários de data ───────────────────────────────────────────────────────
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const INAUGURATION_DATE = new Date(2026, 3, 1) // Abril 2026 (mês zero-based = 3)

const getMonthsSinceInauguration = () => {
  const now = new Date()
  const years = now.getFullYear() - INAUGURATION_DATE.getFullYear()
  const months = now.getMonth() - INAUGURATION_DATE.getMonth()
  return Math.max(1, years * 12 + months + 1)
}

const getPastMonths = (requestedCount) => {
  const months = []
  const now = new Date()
  const available = getMonthsSinceInauguration()
  const count = Math.min(requestedCount, available)

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      year: d.getFullYear(),
      month: d.getMonth()
    })
  }
  return months
}


const getMonthRange = (year, month) => {
  const start = new Date(year, month, 1).toISOString()
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
  return { start, end }
}

const statusLabel = {
  pending: 'Aguardando',
  confirmed: 'Confirmado',
  shipped: 'Enviado',
  delivered: 'Entregue',
  cancelled: 'Cancelado'
}

// ─── Modal de Overlay Premium ─────────────────────────────────────────────────
const ModalOverlay = ({ onClose, children }) => (
  <div
    onClick={(e) => e.target === e.currentTarget && onClose()}
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10, 15, 40, 0.6)',
      backdropFilter: 'blur(8px)',
      zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      animation: 'fadeIn 0.2s ease'
    }}
  >
    <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}`}</style>
    {children}
  </div>
)

// ─── Modal de Relatório (Excel) ───────────────────────────────────────────────
function RelatorioModal({ onClose }) {
  const [months, setMonths] = useState(1)
  const [loading, setLoading] = useState(false)

  const PERIOD_OPTIONS = [1, 2, 3, 4, 5, 6]

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1).toISOString()

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Calcular totais por mês
      const byMonth = {}
      orders.forEach(o => {
        const d = new Date(o.created_at)
        const key = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
        if (!byMonth[key]) byMonth[key] = { mes: key, pedidos: 0, faturamento: 0, ticket_medio: 0 }
        byMonth[key].pedidos += 1
        byMonth[key].faturamento += Number(o.total || 0)
      })
      Object.values(byMonth).forEach(m => {
        m.ticket_medio = m.pedidos > 0 ? m.faturamento / m.pedidos : 0
        m.faturamento = m.faturamento.toFixed(2)
        m.ticket_medio = m.ticket_medio.toFixed(2)
      })

      // Planilha 1 — Resumo por mês
      const resumo = Object.values(byMonth).map(m => ({
        'Período': m.mes,
        'Pedidos': m.pedidos,
        'Faturamento (R$)': m.faturamento,
        'Ticket Médio (R$)': m.ticket_medio
      }))

      // Planilha 2 — Detalhes de cada pedido
      const detalhes = orders.map(o => ({
        'ID Pedido': String(o.id).slice(-8).toUpperCase(),
        'Cliente': typeof o.guest_name === 'string' && o.guest_name ? o.guest_name : 'Visitante',
        'E-mail': typeof o.guest_email === 'string' && o.guest_email ? o.guest_email : '-',
        'Status': statusLabel[o.status] || o.status,
        'Valor (R$)': Number(o.total || 0).toFixed(2),
        'Data': new Date(o.created_at).toLocaleDateString('pt-BR'),
        'Hora': new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }))

      const wb = XLSX.utils.book_new()

      // Estilos de cabeçalho
      const wsResumo = XLSX.utils.json_to_sheet(resumo)
      const wsDetalhes = XLSX.utils.json_to_sheet(detalhes)

      // Configurar largura das colunas
      wsResumo['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 20 }, { wch: 20 }]
      wsDetalhes['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }]

      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Mensal')
      XLSX.utils.book_append_sheet(wb, wsDetalhes, 'Detalhes dos Pedidos')

      const periodLabel = months === 1 ? 'Último mês' : `Últimos ${months} meses`
      const fileName = `Relatorio_Vilaca_${periodLabel.replace(' ', '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`

      XLSX.writeFile(wb, fileName)
      toast.success(`Relatório gerado: ${orders.length} pedidos exportados!`)
      onClose()
    } catch (err) {
      toast.error('Erro ao gerar relatório: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 60px -10px rgba(15,23,42,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-navy-900) 0%, #1e3a5f 100%)',
          padding: '28px 32px 24px',
          position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={16} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '14px',
              width: '52px', height: '52px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileSpreadsheet size={26} color="white" />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0 }}>
                Gerar Relatório
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0' }}>
                Exporte seus dados de faturamento em Excel
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 32px' }}>
          <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px', lineHeight: 1.6 }}>
            Selecione o período desejado para o relatório. O arquivo Excel será gerado com um
            <strong> resumo mensal</strong> e o <strong>detalhamento de cada pedido</strong>.
          </p>

          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '12px' }}>
            Período do Relatório
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '28px' }}>
            {PERIOD_OPTIONS.filter(m => m <= Math.max(1, Math.min(6, getMonthsSinceInauguration()))).map(m => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                style={{
                  border: `2px solid ${months === m ? 'var(--color-navy-900)' : '#E5E7EB'}`,
                  borderRadius: '12px',
                  padding: '14px 12px',
                  cursor: 'pointer',
                  background: months === m ? 'var(--color-navy-900)' : 'white',
                  color: months === m ? 'white' : '#374151',
                  fontWeight: 700,
                  fontSize: '14px',
                  transition: 'all 0.18s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 900 }}>{m}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.7 }}>
                  {m === 1 ? 'mês' : 'meses'}
                </span>
              </button>
            ))}
          </div>

          {/* Preview do período */}
          <div style={{
            background: '#F8FAFC',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #E2E8F0'
          }}>
            <CalendarDays size={16} color="#64748B" />
            <div style={{ fontSize: '13px', color: '#475569' }}>
              <strong>Cobertura:</strong>{' '}
              {(() => {
                const past = getPastMonths(months)
                const oldest = past[past.length - 1]
                const newest = past[0]
                return months === 1
                  ? newest.label
                  : `${oldest.label} → ${newest.label}`
              })()}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#E2E8F0' : 'var(--color-navy-900)',
              color: loading ? '#94A3B8' : 'white',
              border: 'none',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(15,23,42,0.25)',
              transition: 'all 0.2s'
            }}
          >
            {loading
              ? <><Loader2 size={18} className="animate-spin" /> Gerando relatório...</>
              : <><Download size={18} /> Baixar Relatório Excel</>
            }
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ─── Modal de Extrato ─────────────────────────────────────────────────────────
function ExtratoModal({ onClose, onApplyMonth }) {
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [orders, setOrders] = useState([])
  const [totals, setTotals] = useState({ count: 0, revenue: 0, delivered: 0 })
  const [loadingData, setLoadingData] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const pastMonths = getPastMonths(6)

  const fetchMonthOrders = async (year, month) => {
    setLoadingData(true)
    try {
      const { start, end } = getMonthRange(year, month)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: false })

      if (error) throw error

      const revenue = (data || []).reduce((acc, o) => acc + Number(o.total || 0), 0)
      const delivered = (data || []).filter(o => o.status === 'delivered').length
      setOrders(data || [])
      setTotals({ count: data?.length || 0, revenue, delivered })
    } catch (err) {
      toast.error('Erro ao carregar extrato: ' + err.message)
    } finally {
      setLoadingData(false)
    }
  }

  const handleMonthSelect = (m) => {
    setSelectedMonth(m)
    fetchMonthOrders(m.year, m.month)
  }

  const handleApply = () => {
    if (!selectedMonth) return
    onApplyMonth(selectedMonth)
    toast.success(`Dashboard atualizado para ${selectedMonth.label}`)
    onClose()
  }

  const handleDownloadPDF = () => {
    if (!selectedMonth || orders.length === 0) return
    setDownloading(true)

    // Gera HTML estilizado para impressão/PDF
    const totalFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.revenue)
    const rows = orders.map(o => `
      <tr>
        <td>#${String(o.id).slice(-6).toUpperCase()}</td>
        <td>${o.guest_name || 'Visitante'}</td>
        <td><span class="status status-${o.status}">${statusLabel[o.status] || o.status}</span></td>
        <td class="value">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(o.total || 0)}</td>
        <td>${new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
      </tr>
    `).join('')

    const html = `
    <!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">
    <title>Extrato ${selectedMonth.label} — Vilaça</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',system-ui,sans-serif;color:#1E293B;background:#fff;padding:40px}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #E2E8F0}
      .logo{font-size:24px;font-weight:900;color:#0F2255;letter-spacing:-0.5px}
      .logo span{color:#D4A017}
      .meta{text-align:right;font-size:13px;color:#64748B}
      .meta strong{display:block;font-size:15px;color:#1E293B;margin-bottom:4px}
      .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
      .card{background:#F8FAFC;border-radius:12px;padding:16px 20px;border:1px solid #E2E8F0}
      .card-label{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;margin-bottom:6px}
      .card-value{font-size:22px;font-weight:900;color:#0F2255}
      table{width:100%;border-collapse:collapse}
      th{background:#0F2255;color:white;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:left}
      td{padding:12px 14px;border-bottom:1px solid #F1F5F9;font-size:13px}
      tr:nth-child(even) td{background:#F8FAFC}
      .value{font-weight:700;color:#0F2255}
      .status{padding:3px 10px;border-radius:99px;font-size:10px;font-weight:800;text-transform:uppercase}
      .status-confirmed{background:#ECFDF5;color:#10B981}
      .status-pending{background:#FFFBEB;color:#D97706}
      .status-delivered{background:#EFF6FF;color:#3B82F6}
      .status-cancelled{background:#FEF2F2;color:#EF4444}
      .status-shipped{background:#F3E8FF;color:#8B5CF6}
      .footer{margin-top:32px;padding-top:20px;border-top:1px solid #E2E8F0;font-size:11px;color:#94A3B8;text-align:center}
      @media print{button{display:none!important}}
    </style></head><body>
    <div class="header">
      <div class="logo">Vilaça<span>.</span></div>
      <div class="meta">
        <strong>Extrato de ${selectedMonth.label}</strong>
        Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
    <div class="cards">
      <div class="card"><div class="card-label">Total de pedidos</div><div class="card-value">${totals.count}</div></div>
      <div class="card"><div class="card-label">Faturamento</div><div class="card-value">${totalFmt}</div></div>
      <div class="card"><div class="card-label">Entregues</div><div class="card-value">${totals.delivered}</div></div>
    </div>
    <table><thead><tr><th>ID</th><th>Cliente</th><th>Status</th><th>Valor</th><th>Data</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="footer">Vilaça Esquadrias e Vidros · Relatório gerado automaticamente pelo sistema</div>
    </body></html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Extrato_Vilaca_${selectedMonth.label.replace(' ', '_')}.html`
    a.click()
    URL.revokeObjectURL(url)
    setDownloading(false)
    toast.success('Extrato baixado! Abra o arquivo e use Ctrl+P para salvar como PDF.')
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -10px rgba(15,23,42,0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a2e5e 0%, #0d1f4a 100%)',
          padding: '28px 32px 24px',
          position: 'relative',
          flexShrink: 0
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
            width: '32px', height: '32px', color: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}><X size={16} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '14px',
              width: '52px', height: '52px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Receipt size={26} color="white" />
            </div>
            <div>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0 }}>
                Extrato Mensal
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '4px 0 0' }}>
                Visualize e exporte o extrato de qualquer mês
              </p>
            </div>
          </div>
        </div>

        {/* Body — scrollável */}
        <div style={{ padding: '24px 32px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
            Selecione um mês para atualizar o dashboard em tempo real ou baixar o extrato.
          </p>

          {/* Seleção de mês */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }}>
            {pastMonths.map((m, i) => {
              const isSelected = selectedMonth?.label === m.label
              return (
                <button
                  key={i}
                  onClick={() => handleMonthSelect(m)}
                  style={{
                    border: `2px solid ${isSelected ? 'var(--color-navy-900)' : '#E5E7EB'}`,
                    borderRadius: '12px',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--color-navy-900)' : 'white',
                    color: isSelected ? 'white' : '#374151',
                    fontWeight: 600,
                    fontSize: '14px',
                    transition: 'all 0.18s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <span>{m.label}</span>
                  {i === 0 && <span style={{ fontSize: '10px', fontWeight: 800, opacity: 0.7, background: isSelected ? 'rgba(255,255,255,0.2)' : '#F1F5F9', padding: '2px 8px', borderRadius: '99px', color: isSelected ? 'white' : '#64748B' }}>Atual</span>}
                  {isSelected && <CheckCircle2 size={16} />}
                </button>
              )
            })}
          </div>

          {/* Preview em tempo real */}
          {selectedMonth && (
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '20px',
              marginBottom: '20px',
              minHeight: '120px'
            }}>
              {loadingData ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 0', justifyContent: 'center' }}>
                  <Loader2 size={20} className="animate-spin" color="#64748B" />
                  <span style={{ color: '#64748B', fontSize: '14px' }}>Carregando extrato...</span>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                    Resumo — {selectedMonth.label}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                    {[
                      { label: 'Pedidos', value: totals.count, icon: <TrendingUp size={14} /> },
                      { label: 'Faturamento', value: fmtCurrency(totals.revenue), icon: <BarChart2 size={14} /> },
                      { label: 'Entregues', value: totals.delivered, icon: <CheckCircle2 size={14} /> },
                    ].map((stat, i) => (
                      <div key={i} style={{ background: 'white', borderRadius: '10px', padding: '12px', border: '1px solid #E2E8F0', textAlign: 'center' }}>
                        <div style={{ color: '#64748B', marginBottom: '4px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>{stat.value}</div>
                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tabela de pedidos mini */}
                  {orders.length > 0 && (
                    <div style={{ overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                          <tr style={{ background: '#F1F5F9' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#64748B' }}>ID</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#64748B' }}>Cliente</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#64748B' }}>Status</th>
                            <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#64748B' }}>Valor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 8).map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>#{String(o.id).slice(-6).toUpperCase()}</td>
                              <td style={{ padding: '7px 10px', color: '#1E293B' }}>{o.guest_name || 'Visitante'}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <span style={{
                                  fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase',
                                  background: o.status === 'confirmed' ? '#ECFDF5' : o.status === 'pending' ? '#FFFBEB' : '#F1F5F9',
                                  color: o.status === 'confirmed' ? '#10B981' : o.status === 'pending' ? '#D97706' : '#64748B'
                                }}>{statusLabel[o.status] || o.status}</span>
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: '#1E293B' }}>{fmtCurrency(o.total)}</td>
                            </tr>
                          ))}
                          {orders.length > 8 && (
                            <tr><td colSpan="4" style={{ padding: '8px 10px', textAlign: 'center', color: '#94A3B8', fontSize: '11px', fontStyle: 'italic' }}>+ {orders.length - 8} pedidos no extrato completo</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {orders.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: '14px', padding: '20px 0' }}>Nenhum pedido neste período.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer com ações */}
        <div style={{
          padding: '16px 32px',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: '12px',
          background: '#FAFAFA',
          flexShrink: 0
        }}>
          <button
            onClick={handleDownloadPDF}
            disabled={!selectedMonth || downloading}
            style={{
              flex: 1,
              padding: '12px',
              background: (!selectedMonth) ? '#F1F5F9' : 'white',
              color: (!selectedMonth) ? '#94A3B8' : '#1E293B',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: (!selectedMonth) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Download size={16} /> Baixar Extrato
          </button>
          <button
            onClick={handleApply}
            disabled={!selectedMonth}
            style={{
              flex: 1,
              padding: '12px',
              background: !selectedMonth ? '#E2E8F0' : 'var(--color-navy-900)',
              color: !selectedMonth ? '#94A3B8' : 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: !selectedMonth ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: selectedMonth ? '0 4px 14px rgba(15,23,42,0.2)' : 'none'
            }}
          >
            <TrendingUp size={16} /> Aplicar ao Dashboard
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

// ─── Admin Dashboard Principal ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [showValues, setShowValues] = useState(true)
  const [showRelatorio, setShowRelatorio] = useState(false)
  const [showExtrato, setShowExtrato] = useState(false)
  const [activeMonthFilter, setActiveMonthFilter] = useState(null) // null = mês atual

  const [stats, setStats] = useState({
    revenueMonth: 0,
    ordersCountMonth: 0,
    ticketMedio: 0,
    receivedCount: 0,
    deliveredCount: 0,
    deliveredTicketMedio: 0,
    recentOrders: []
  })

  const fetchStats = async (monthFilter = null) => {
    setLoading(true)
    try {
      let firstDayMonth, lastDayMonth
      if (monthFilter) {
        const { start, end } = getMonthRange(monthFilter.year, monthFilter.month)
        firstDayMonth = start
        lastDayMonth = end
      } else {
        const now = new Date()
        firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        lastDayMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
      }

      // 1. Faturamento e pedidos do período selecionado
      let query = supabase.from('orders').select('total, created_at').gte('created_at', firstDayMonth)
      if (lastDayMonth) query = query.lte('created_at', lastDayMonth)
      const { data: monthOrders, error: errO } = await query

      let revMonth = 0, countMonth = 0
      if (!errO && monthOrders) {
        revMonth = monthOrders.reduce((acc, curr) => acc + Number(curr.total || 0), 0)
        countMonth = monthOrders.length
      }

      // 2. Total histórico de pedidos recebidos
      const { count: totalReceived } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      // 3. Pedidos entregues (período selecionado)
      let queryD = supabase.from('orders').select('total').eq('status', 'delivered').gte('created_at', firstDayMonth)
      if (lastDayMonth) queryD = queryD.lte('created_at', lastDayMonth)
      const { data: deliveredOrders } = await queryD

      const revDelivered = (deliveredOrders || []).reduce((acc, curr) => acc + Number(curr.total || 0), 0)
      const countDelivered = deliveredOrders?.length || 0

      // 4. Pedidos recentes (sempre os últimos 5, independente do filtro)
      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        revenueMonth: revMonth,
        ordersCountMonth: countMonth,
        ticketMedio: countMonth > 0 ? revMonth / countMonth : 0,
        receivedCount: totalReceived || 0,
        deliveredCount: countDelivered,
        deliveredTicketMedio: countDelivered > 0 ? revDelivered / countDelivered : 0,
        recentOrders: recent || []
      })

    } catch (error) {
      console.error('Erro ao buscar stats:', error)
      toast.error('Erro ao carregar estatísticas do dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats(activeMonthFilter)
  }, [activeMonthFilter])

  const handleApplyMonth = (month) => {
    setActiveMonthFilter(month)
  }

  const maskValue = (value) => showValues ? value : 'R$ •••••'

  if (loading) {
    return (
      <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
        <Loader2 className="animate-spin" size={32} color="var(--color-navy-700)" />
        <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Carregando dados...</span>
      </div>
    )
  }

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <>
      {showRelatorio && <RelatorioModal onClose={() => setShowRelatorio(false)} />}
      {showExtrato && <ExtratoModal onClose={() => setShowExtrato(false)} onApplyMonth={handleApplyMonth} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* Boas Vindas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', margin: 0 }}>
              Olá, {profile?.full_name?.split(' ')[0] || 'Administrador'}.
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <p style={{ color: '#64748B', fontSize: '14px', margin: 0, textTransform: 'capitalize' }}>
                {todayStr}
              </p>
              {activeMonthFilter && (
                <span style={{
                  fontSize: '12px', fontWeight: 700, color: '#D97706',
                  background: '#FFFBEB', padding: '2px 10px', borderRadius: '99px',
                  border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '5px'
                }}>
                  📅 Exibindo: {activeMonthFilter.label}
                  <button
                    onClick={() => setActiveMonthFilter(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D97706', padding: '0', display: 'flex', alignItems: 'center' }}
                    title="Voltar ao mês atual"
                  ><X size={12} /></button>
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setShowValues(!showValues)}
              title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
              style={{ border: '1px solid #E2E8F0', background: 'white', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            <button
              onClick={() => setShowRelatorio(true)}
              style={{ border: '1px solid #E2E8F0', background: 'white', padding: '0 16px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <BarChart2 size={18} /> Relatório
            </button>
            <button
              onClick={() => setShowExtrato(true)}
              style={{ border: '1px solid #E2E8F0', background: 'white', padding: '0 16px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <Receipt size={18} /> Extrato
            </button>
            <button style={{ border: 'none', background: 'var(--color-navy-900)', padding: '0 20px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'white', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.15)' }}>
              <Play size={16} /> Tutoriais
            </button>
          </div>
        </div>

        {/* Grid Principal de Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>

          {/* Faturamento mensal (vendas) */}
          <div style={{ background: 'var(--color-navy-900)', borderRadius: '24px', padding: '28px', color: 'white', boxShadow: '0 10px 25px -5px rgba(23, 34, 86, 0.3)', position: 'relative', overflow: 'hidden', minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>
                Faturamento {activeMonthFilter ? activeMonthFilter.label : 'mensal (vendas)'}
              </span>
              <a href="/admin/pedidos" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Ver detalhes &rsaquo;</a>
            </div>
            <div style={{ position: 'relative', zIndex: 1, marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
                  {maskValue(fmtCurrency(stats.revenueMonth))}
                </h2>
              </div>
            </div>
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', marginTop: 'auto' }}>
              <div>
                <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>Ticket-médio</span>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{maskValue(fmtCurrency(stats.ticketMedio))}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.5px' }}>Vendas no período</span>
                <span style={{ fontSize: '12px', fontWeight: 700 }}>{stats.ordersCountMonth} vendas</span>
              </div>
            </div>
          </div>

          {/* Pedidos recebidos */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: '190px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Pedidos recebidos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                {stats.receivedCount} <span style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8' }}>no total</span>
              </h2>
            </div>
            <div style={{ marginTop: '16px' }}>
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>Volume no período</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{stats.ordersCountMonth} pedidos</span>
            </div>
            <button
              onClick={() => window.location.href = '/admin/pedidos'}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px', marginTop: 'auto', background: 'transparent', fontSize: '11px', fontWeight: 700, color: '#94A3B8', cursor: 'pointer' }}
            >
              Ver mais &rarr;
            </button>
          </div>

          {/* Pedidos entregues */}
          <div style={{ background: 'white', borderRadius: '24px', padding: '28px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: '190px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748B' }}>Pedidos entregues</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', margin: 0 }}>{stats.deliveredCount}</h2>
              <span style={{ background: '#ECFDF5', color: '#10B981', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>Concluídos</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <div>
                <span style={{ display: 'block', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>Ticket-médio</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{maskValue(fmtCurrency(stats.deliveredTicketMedio))}</span>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/admin/pedidos-detalhados'}
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px', marginTop: 'auto', background: 'transparent', fontSize: '11px', fontWeight: 700, color: '#94A3B8', cursor: 'pointer' }}
            >
              Gerenciar Detalhes &rarr;
            </button>
          </div>

        </div>

        {/* Pedidos Recentes */}
        <div style={{ background: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#F8FAFC', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-navy-900)' }}><Clock size={20} /></div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Pedidos Recentes</h3>
            </div>
            <a href="/admin/pedidos" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-700)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Ver todos <ChevronRight size={16} />
            </a>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>ID</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>Cliente</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px' }}>Valor</th>
                  <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.5px', textAlign: 'right' }}>Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>Nenhum pedido recente.</td></tr>
                ) : (
                  stats.recentOrders.map(order => (
                    <tr key={order.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>#{String(order.id).slice(-6).toUpperCase()}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{order.guest_name || 'Visitante'}</div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{order.guest_email || '-'}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '99px', textTransform: 'uppercase',
                          background: order.status === 'confirmed' ? '#ECFDF5' : (order.status === 'pending' ? '#FFFBEB' : '#F1F5F9'),
                          color: order.status === 'confirmed' ? '#10B981' : (order.status === 'pending' ? '#D97706' : '#64748B')
                        }}>
                          {statusLabel[order.status] || order.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{maskValue(fmtCurrency(order.total))}</td>
                      <td style={{ padding: '16px', fontSize: '12px', color: '#64748B', textAlign: 'right' }}>{new Date(order.created_at).toLocaleDateString('pt-BR')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
