import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import {
    Ticket, Plus, Trash2, Calendar,
    Percent, DollarSign, ToggleLeft, ToggleRight, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fmtCurrency } from '../utils/formatters'
import ConfirmModal from '../components/ConfirmModal'

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'percentage',
        value: '',
        expires_at: '',
        usage_limit: ''
    })
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false })

    useEffect(() => {
        fetchCoupons()
    }, [])

    async function fetchCoupons() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setCoupons(data || [])
        } catch (error) {
            console.error('Erro ao buscar cupons:', error)
            toast.error('Erro ao carregar cupons')
        } finally {
            setLoading(false)
        }
    }

    async function handleAddCoupon(e) {
        e.preventDefault()
        if (!newCoupon.code || !newCoupon.value) {
            return toast.error('Preencha os campos obrigatórios')
        }

        try {
            const { data, error } = await supabase
                .from('coupons')
                .insert([{
                    code: newCoupon.code.toUpperCase(),
                    type: newCoupon.type,
                    value: Number(newCoupon.value),
                    expires_at: newCoupon.expires_at || null,
                    usage_limit: newCoupon.usage_limit ? Number(newCoupon.usage_limit) : null
                }])
                .select()

            if (error) {
                if (error.code === '23505') throw new Error('Este código de cupom já existe')
                throw error
            }

            toast.success('Cupom criado com sucesso!')
            setCoupons([data[0], ...coupons])
            setShowAddForm(false)
            setNewCoupon({ code: '', type: 'percentage', value: '', expires_at: '', usage_limit: '' })
        } catch (error) {
            console.error('Erro ao criar cupom:', error)
            toast.error(error.message || 'Erro ao criar cupom')
        }
    }

    async function toggleStatus(id, currentStatus) {
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ is_active: !currentStatus })
                .eq('id', id)

            if (error) throw error
            setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c))
            toast.success('Status do cupom atualizado')
        } catch (error) {
            console.error('Erro ao atualizar cupom:', error)
            toast.error('Erro ao atualizar status')
        }
    }

    async function deleteCoupon(id) {
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Cupom',
            message: 'Tem certeza que deseja excluir este cupom? Esta ação não pode ser desfeita.',
            type: 'danger',
            confirmText: 'Sim, Excluir',
            onConfirm: () => executeDeleteCoupon(id)
        })
    }

    async function executeDeleteCoupon(id) {

        try {
            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', id)

            if (error) throw error
            setCoupons(coupons.filter(c => c.id !== id))
            toast.success('Cupom excluído')
        } catch (error) {
            console.error('Erro ao excluir cupom:', error)
            toast.error('Erro ao excluir cupom')
        }
    }

    if (loading && coupons.length === 0) {
        return (
            <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-navy-700)" />
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Carregando cupons...</span>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', margin: 0 }}>
                        Gestão de Cupons
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>
                        Crie e gerencie códigos de desconto para seus clientes
                    </p>
                </div>

                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        background: 'var(--color-navy-900)',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '14px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)'
                    }}
                >
                    <Plus size={18} /> Novo Cupom
                </button>
            </div>

            {showAddForm && (
                <div style={{ background: 'white', borderRadius: '24px', padding: '32px', border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '24px', color: '#1E293B' }}>Cadastrar Novo Cupom</h3>
                    <form onSubmit={handleAddCoupon} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>CÓDIGO</label>
                            <input
                                type="text"
                                placeholder="Ex: VERAO10"
                                value={newCoupon.code}
                                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>TIPO</label>
                            <select
                                value={newCoupon.type}
                                onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value })}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '2px solid #E2E8F0',
                                    outline: 'none',
                                    background: 'white',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: '#1E293B',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="percentage">Porcentagem (%)</option>
                                <option value="fixed">Valor Fixo (R$)</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>VALOR</label>
                            <input
                                type="number"
                                placeholder="Ex: 10"
                                value={newCoupon.value}
                                onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
                                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>LIMITE DE USO</label>
                            <input
                                type="number"
                                placeholder="Vazio para ilimitado"
                                value={newCoupon.usage_limit}
                                onChange={e => setNewCoupon({ ...newCoupon, usage_limit: e.target.value })}
                                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>EXPIRA EM</label>
                            <input
                                type="date"
                                value={newCoupon.expires_at}
                                onChange={e => setNewCoupon({ ...newCoupon, expires_at: e.target.value })}
                                style={{ padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="submit" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--color-navy-900)', color: 'white', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.2)' }}>Salvar Cupom</button>
                        </div>
                    </form>
                </div>
            )}

            <div style={{ background: 'white', borderRadius: '24px', padding: '0', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Código</th>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Desconto</th>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Uso</th>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Expiração</th>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>Status</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>Nenhum cupom cadastrado.</td>
                                </tr>
                            ) : (
                                coupons.map(coupon => (
                                    <tr key={coupon.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F0F9FF', color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Ticket size={16} />
                                                </div>
                                                <span style={{ fontWeight: 800, color: '#1E293B', letterSpacing: '0.05em' }}>{coupon.code}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {coupon.type === 'percentage' ? <Percent size={14} /> : <DollarSign size={14} />}
                                                {coupon.type === 'percentage' ? `${coupon.value}%` : fmtCurrency(coupon.value)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: '13px', color: '#64748B' }}>
                                                <span style={{ fontWeight: 700, color: '#1E293B' }}>{coupon.used_count}</span>{' '}
                                                / {coupon.usage_limit || '∞'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={14} />
                                                {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('pt-BR') : 'Sem expiração'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <button
                                                onClick={() => toggleStatus(coupon.id, coupon.is_active)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: coupon.is_active ? '#10B981' : '#94A3B8' }}
                                            >
                                                {coupon.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                            </button>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => deleteCoupon(coupon.id)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F43F5E', padding: '8px' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal
                {...confirmConfig}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />
        </div>
    )
}
