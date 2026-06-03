import { Palette, Layers, ChevronRight, Loader2 } from 'lucide-react'

export default function AdminCostsGlassTab({
    loading,
    colors,
    setShowGlobalColorsModal,
    glassTypesList,
    setActiveGlassModal
}) {
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                <Loader2 className="animate-spin" size={36} color="var(--color-amber-500)" />
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Card Especial de Cores Globais */}
                <div style={{
                    background: 'linear-gradient(135deg, var(--color-navy-900) 0%, #1a2a4b 100%)',
                    borderRadius: '24px', border: '1px solid rgba(229, 231, 235, 0.8)',
                    overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.1)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(13, 15, 36, 0.15)' }}>
                            <Palette size={24} />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'white', textAlign: 'center', letterSpacing: '-0.5px' }}> Cores</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, textAlign: 'center' }}>
                            {colors.length} {colors.length === 1 ? 'Cor cadastrada' : 'Cores cadastradas'}
                        </span>
                    </div>
                    <div style={{ padding: '16px' }}>
                        <button onClick={() => setShowGlobalColorsModal(true)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                            Gerenciar Cores <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Tipos de Vidro */}
                {glassTypesList.map(({ type, thicknesses }) => (
                    <div key={type} style={{
                        background: 'white',
                        borderRadius: '24px', border: '1px solid rgba(229, 231, 235, 0.8)',
                        overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid #F3F4F6' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(13, 15, 36, 0.15)' }}>
                                <Layers size={24} />
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-navy-900)', textAlign: 'center', letterSpacing: '-0.5px' }}>{type.toUpperCase()}</span>
                            <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500, textAlign: 'center' }}>
                                {thicknesses.length} {thicknesses.length === 1 ? 'Espessura cadastrada' : 'Espessuras cadastradas'}
                            </span>
                        </div>
                        <div style={{ padding: '16px' }}>
                            <button onClick={() => setActiveGlassModal(type)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', border: 'none', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                                Ver Espessuras/Cores <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
