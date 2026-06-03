import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import {
    Users, Shield, ShieldCheck, Search, Loader2,
    Mail, MapPin, MoreVertical, LogOut, UserMinus, X, Phone, Calendar, IdCard
} from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'

export default function AdminUsers() {
    const [profiles, setProfiles] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [openMenuId, setOpenMenuId] = useState(null)
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false })
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const [selectedUserProfile, setSelectedUserProfile] = useState(null)

    useEffect(() => {
        fetchProfiles()
        const handleClickOutside = () => setOpenMenuId(null)
        const handleResize = () => setIsMobile(window.innerWidth <= 768)
        
        window.addEventListener('click', handleClickOutside)
        window.addEventListener('resize', handleResize)
        
        return () => {
            window.removeEventListener('click', handleClickOutside)
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    async function fetchProfiles() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('full_name', { ascending: true })

            if (error) throw error
            setProfiles(data || [])
        } catch (error) {
            console.error('Erro ao buscar perfis:', error)
            toast.error('Erro ao carregar usuários')
        } finally {
            setLoading(false)
        }
    }

    async function toggleAdmin(profileId, currentRole) {
        const newRole = currentRole === 'admin' ? 'client' : 'admin'

        setConfirmConfig({
            isOpen: true,
            title: 'Alterar Permissão',
            message: `Deseja realmente alterar a permissão deste usuário para ${newRole.toUpperCase()}?`,
            type: 'warning',
            confirmText: 'Sim, Alterar',
            onConfirm: () => executeToggleAdmin(profileId, newRole)
        })
    }

    async function executeToggleAdmin(profileId, newRole) {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', profileId)

            if (error) throw error

            toast.success(`Usuário agora é ${newRole}`)
            setProfiles(profiles.map(p => p.id === profileId ? { ...p, role: newRole } : p))
        } catch (error) {
            console.error('Erro ao atualizar role:', error)
            toast.error('Erro ao atualizar permissão')
        }
    }

    function confirmDeleteUser(targetProfile) {
        setOpenMenuId(null)
        setConfirmConfig({
            isOpen: true,
            title: 'Excluir Usuário',
            message: `Deseja realmente excluir a conta de "${targetProfile.full_name || 'usuário'}"? Esta ação é permanente e não pode ser desfeita.`,
            type: 'danger',
            confirmText: 'Sim, Excluir',
            onConfirm: () => executeDeleteUser(targetProfile.id)
        })
    }

    async function executeDeleteUser(targetId) {
        try {
            const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: targetId })

            if (error) throw error

            toast.success('Usuário excluído com sucesso')
            setProfiles(profiles.filter(p => p.id !== targetId))
        } catch (err) {
            console.error('Erro ao excluir usuário:', err)
            toast.error(err.message || 'Erro ao excluir usuário')
        }
    }

    const filteredProfiles = profiles.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading && profiles.length === 0) {
        return (
            <div style={{ height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                <Loader2 className="animate-spin" size={32} color="var(--color-navy-700)" />
                <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 600 }}>Carregando usuários...</span>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1E293B', letterSpacing: '-0.5px', margin: 0 }}>
                        Gestão de Usuários
                    </h1>
                    <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>
                        Gerencie as permissões de acesso ao sistema
                    </p>
                </div>

                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '10px 16px 10px 40px',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0',
                            fontSize: '14px',
                            width: '300px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    />
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '24px', padding: '0', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div>
                {isMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredProfiles.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>Nenhum usuário encontrado.</div>
                        ) : (
                            filteredProfiles.map((profile) => (
                                <div key={profile.id} style={{ padding: '20px', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} alt="" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-navy-50)', color: 'var(--color-navy-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
                                                    {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B' }}>{profile.full_name || 'Usuário sem nome'}</div>
                                                <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{profile.id.slice(0, 8)}...</div>
                                            </div>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === profile.id ? null : profile.id);
                                                }}
                                                style={{
                                                    padding: '8px', borderRadius: '10px', border: '1px solid #E2E8F0',
                                                    background: 'white', color: '#64748B', cursor: 'pointer',
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>
                                            
                                            {openMenuId === profile.id && (
                                                <div style={{
                                                    position: 'absolute', top: '40px', right: '0', background: 'white',
                                                    borderRadius: '12px', border: '1px solid #E2E8F0',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 1000,
                                                    minWidth: '180px', overflow: 'hidden'
                                                }}>
                                                    <button onClick={() => { setOpenMenuId(null); setSelectedUserProfile(profile) }} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                                                        <Search size={16} color="var(--color-navy-600)" />
                                                        Mostrar dados
                                                    </button>
                                                    <button onClick={() => toggleAdmin(profile.id, profile.role)} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                                                        <Shield size={16} color="var(--color-navy-600)" />
                                                        {profile.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                                    </button>
                                                    <button onClick={() => confirmDeleteUser(profile)} style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600, color: '#EF4444', cursor: 'pointer' }}>
                                                        <UserMinus size={16} />
                                                        Excluir Usuário
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                                            textTransform: 'uppercase', background: profile.role === 'admin' ? '#ECFDF5' : '#F1F5F9',
                                            color: profile.role === 'admin' ? '#059669' : '#64748B'
                                        }}>
                                            {profile.role === 'admin' ? <ShieldCheck size={12} /> : <Users size={12} />}
                                            {profile.role === 'admin' ? 'Administrador' : 'Cliente'}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: '#F8FAFC', borderRadius: '12px' }}>
                                        {(() => {
                                            const addrData = profile.address_json
                                            const selected = addrData?.addresses?.find(a => a.id === addrData?.selected_id)
                                                || addrData?.addresses?.[0]
                                                || (addrData?.billing ? addrData.billing : null)
                                            return (
                                                <>
                                                    <div style={{ fontSize: '13px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: selected ? '4px' : '0' }}>
                                                        <Mail size={14} /> {profile.email || 'Email indisponível'}
                                                    </div>
                                                    {selected ? (
                                                        <>
                                                            <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                Rua {selected.street}{selected.number ? `, ${selected.number}` : ''}{selected.complement ? ` - ${selected.complement}` : ''}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {selected.neighborhood ? `Bairro ${selected.neighborhood} - ` : ''}CEP {selected.cep}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <MapPin size={14} /> Sem endereço cadastrado
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        })()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>Usuário</th>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>Acesso</th>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em' }}>Detalhes</th>
                                <th style={{ padding: '16px 24px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.05em', textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: '#94A3B8' }}>Nenhum usuário encontrado.</td>
                                </tr>
                            ) : (
                                filteredProfiles.map((profile) => (
                                    <tr key={profile.id} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--color-navy-50)', color: 'var(--color-navy-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                                        {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                )}
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>{profile.full_name || 'Usuário sem nome'}</div>
                                                    <div style={{ fontSize: '12px', color: '#64748B', fontFamily: 'monospace' }}>{profile.id.slice(0, 8)}...</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '4px 10px',
                                                borderRadius: '99px',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                background: profile.role === 'admin' ? '#ECFDF5' : '#F1F5F9',
                                                color: profile.role === 'admin' ? '#059669' : '#64748B'
                                            }}>
                                                {profile.role === 'admin' ? <ShieldCheck size={12} /> : <Users size={12} />}
                                                {profile.role === 'admin' ? 'Administrador' : 'Cliente'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {(() => {
                                                    const addrData = profile.address_json
                                                    const selected = addrData?.addresses?.find(a => a.id === addrData?.selected_id)
                                                        || addrData?.addresses?.[0]
                                                        || (addrData?.billing ? addrData.billing : null)
                                                    return (
                                                        <>
                                                            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: selected ? '4px' : '0' }}>
                                                                <Mail size={12} /> {profile.email || 'Email indisponível'}
                                                            </div>
                                                            {selected ? (
                                                                <>
                                                                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        Rua {selected.street}{selected.number ? `, ${selected.number}` : ''}{selected.complement ? ` - ${selected.complement}` : ''}
                                                                    </div>
                                                                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        {selected.neighborhood ? `Bairro ${selected.neighborhood} - ` : ''}CEP {selected.cep}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div style={{ fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <MapPin size={12} /> Sem endereço cadastrado
                                                                </div>
                                                            )}
                                                        </>
                                                    )
                                                })()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right', position: 'relative' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === profile.id ? null : profile.id);
                                                }}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '10px',
                                                    border: '1px solid #E2E8F0',
                                                    background: 'white',
                                                    color: '#64748B',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748B'; }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === profile.id && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '40px',
                                                    right: '24px',
                                                    background: 'white',
                                                    borderRadius: '12px',
                                                    border: '1px solid #E2E8F0',
                                                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                                                    zIndex: 1000,
                                                    minWidth: '180px',
                                                    overflow: 'hidden',
                                                    animation: 'slideIn 0.2s ease-out',
                                                    transformOrigin: 'top right'
                                                }}>
                                                    <style>{`
                                                        @keyframes slideIn {
                                                            from { opacity: 0; transform: translateY(-10px); }
                                                            to { opacity: 1; transform: translateY(0); }
                                                        }
                                                    `}</style>
                                                    <button
                                                        onClick={() => { setOpenMenuId(null); setSelectedUserProfile(profile) }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            background: 'none',
                                                            border: 'none',
                                                            borderBottom: '1px solid #F1F5F9',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: '#475569',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <Search size={16} color="var(--color-navy-600)" />
                                                        Mostrar dados
                                                    </button>
                                                    <button
                                                        onClick={() => toggleAdmin(profile.id, profile.role)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            background: 'none',
                                                            border: 'none',
                                                            borderBottom: '1px solid #F1F5F9',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: '#475569',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <Shield size={16} color="var(--color-navy-600)" />
                                                        {profile.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDeleteUser(profile)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px 16px',
                                                            textAlign: 'left',
                                                            background: 'none',
                                                            border: 'none',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            fontSize: '13px',
                                                            fontWeight: 600,
                                                            color: '#EF4444',
                                                            cursor: 'pointer',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <UserMinus size={16} />
                                                        Excluir Usuário
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
                </div>
            </div>

            {selectedUserProfile && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }} onClick={() => setSelectedUserProfile(null)}>
                    <div style={{
                        background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px',
                        maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setSelectedUserProfile(null)}
                            style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                        >
                            <X size={24} />
                        </button>
                        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1E293B', marginBottom: '24px' }}>Detalhes do Cliente</h2>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                {selectedUserProfile.avatar_url ? (
                                    <img src={selectedUserProfile.avatar_url} alt="" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--color-navy-50)', color: 'var(--color-navy-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '24px' }}>
                                        {selectedUserProfile.full_name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B' }}>{selectedUserProfile.full_name || 'Sem nome'}</div>
                                    <div style={{ fontSize: '14px', color: '#64748B' }}>ID: {selectedUserProfile.id}</div>
                                </div>
                            </div>

                            <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
                                    <Mail size={16} color="#94A3B8" /> <strong>E-mail:</strong> {selectedUserProfile.email || 'Não informado'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
                                    {(() => {
                                        const defaultAddr = selectedUserProfile.address_json?.addresses?.find(a => a.id === selectedUserProfile.address_json?.selected_id) || selectedUserProfile.address_json?.addresses?.[0];
                                        const mainPhone = defaultAddr?.phone || selectedUserProfile.phone || 'Não informado';
                                        return <><Phone size={16} color="#94A3B8" /> <strong>Telefone:</strong> {mainPhone}</>
                                    })()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
                                    {(() => {
                                        const defaultAddr = selectedUserProfile.address_json?.addresses?.find(a => a.id === selectedUserProfile.address_json?.selected_id) || selectedUserProfile.address_json?.addresses?.[0];
                                        const mainCpf = defaultAddr?.cpf || 'Não informado';
                                        return <><IdCard size={16} color="#94A3B8" /> <strong>CPF / CNPJ:</strong> {mainCpf}</>
                                    })()}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
                                    <Calendar size={16} color="#94A3B8" /> <strong>Data de cadastro:</strong> {selectedUserProfile.created_at ? new Date(selectedUserProfile.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '14px' }}>
                                    <Shield size={16} color="#94A3B8" /> <strong>Acesso:</strong> {selectedUserProfile.role === 'admin' ? 'Administrador' : 'Cliente'}
                                </div>
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', marginTop: '16px' }}>Endereços Salvos</h3>
                            {(() => {
                                const addresses = selectedUserProfile.address_json?.addresses || [];
                                if (addresses.length === 0) {
                                    return <div style={{ color: '#94A3B8', fontSize: '14px' }}>Nenhum endereço cadastrado.</div>
                                }
                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {addresses.map((addr, idx) => (
                                            <div key={addr.id || idx} style={{ border: '1px solid #E2E8F0', padding: '16px', borderRadius: '12px', position: 'relative' }}>
                                                {selectedUserProfile.address_json?.selected_id === addr.id && (
                                                    <span style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--color-navy-500)', color: 'white', fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '99px', textTransform: 'uppercase' }}>Padrão</span>
                                                )}
                                                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B', marginBottom: '4px', textTransform: 'capitalize' }}>
                                                    {addr.type || 'Residencial'}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '2px' }}>
                                                    Rua {addr.street}{addr.number ? `, ${addr.number}` : ''}{addr.complement ? ` - ${addr.complement}` : ''}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#64748B' }}>
                                                    Bairro {addr.neighborhood} - {addr.city}/{addr.state}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#64748B' }}>
                                                    CEP: {addr.cep}
                                                </div>
                                                {addr.phone && (
                                                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                                                        Contato: {addr.phone}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                {...confirmConfig}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
            />
        </div>
    )
}
