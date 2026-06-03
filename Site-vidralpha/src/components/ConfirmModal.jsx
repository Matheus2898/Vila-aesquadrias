import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react'

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger' // 'danger' | 'warning' | 'info'
}) {
    if (!isOpen) return null

    const colors = {
        danger: {
            bg: '#FEF2F2',
            icon: '#EF4444',
            button: '#EF4444',
            lightIcon: 'rgba(239, 68, 68, 0.1)',
            Icon: AlertCircle
        },
        warning: {
            bg: '#FFFBEB',
            icon: '#D97706',
            button: 'var(--color-navy-900)',
            lightIcon: 'rgba(217, 119, 6, 0.1)',
            Icon: AlertTriangle
        },
        info: {
            bg: '#F0F9FF',
            icon: '#0284C7',
            button: 'var(--color-navy-900)',
            lightIcon: 'rgba(2, 132, 199, 0.1)',
            Icon: Info
        }
    }

    const theme = colors[type] || colors.danger
    const IconComponent = theme.Icon

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(10, 15, 40, 0.65)',
            backdropFilter: 'blur(6px)',
            zIndex: 999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
        }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(-10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>

            <div style={{
                background: 'white',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                animation: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative'
            }}>
                {/* Botão Fechar no Topo */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: '#F8FAFC', border: 'none', borderRadius: '50%',
                        width: '32px', height: '32px', color: '#94A3B8', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#1E293B'}
                    onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
                >
                    <X size={16} />
                </button>

                <div style={{ padding: '32px' }}>
                    {/* Ícone Redondo */}
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '20px',
                        background: theme.lightIcon, color: theme.icon,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <IconComponent size={32} />
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E293B', marginBottom: '12px', margin: 0 }}>
                        {title}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6, margin: '8px 0 0' }}>
                        {message}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '12px', borderRadius: '14px',
                                border: '1.5px solid #E2E8F0', background: 'white',
                                color: '#64748B', fontWeight: 700, fontSize: '14px',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm()
                                onClose()
                            }}
                            style={{
                                flex: 2, padding: '12px', borderRadius: '14px',
                                border: 'none', background: theme.button,
                                color: 'white', fontWeight: 700, fontSize: '14px',
                                cursor: 'pointer', transition: 'all 0.2s',
                                boxShadow: `0 4px 12px ${theme.lightIcon}`
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
