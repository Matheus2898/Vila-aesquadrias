import { Pipette, ChevronRight, Loader2 } from 'lucide-react'

export default function AdminCostsAluminumTab({
    loading,
    alumColors,
    setShowAlumColorsModal,
    lines,
    structure,
    activeAlumColorsByKey,
    setActiveAlumLine
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
            {/* Grid: 1 card por LINHA + card de gerenciar cores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>

                {/* Card Especial: Gerenciar Cores Globais */}
                <div style={{
                    background: 'linear-gradient(135deg, #172256 0%, #25337a 100%)',
                    borderRadius: '24px', border: '1px solid rgba(229, 231, 235, 0.8)',
                    overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(255,255,255,0.15)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pipette size={24} />
                        </div>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'white', textAlign: 'center', letterSpacing: '-0.5px' }}>Cores de Perfil</span>
                        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', fontWeight: 500, textAlign: 'center' }}>
                            {alumColors.length} {alumColors.length === 1 ? 'cor cadastrada' : 'cores cadastradas'}
                        </span>
                    </div>
                    <div style={{ padding: '16px' }}>
                        <button onClick={() => setShowAlumColorsModal(true)} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                            Gerenciar Cores <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* 1 card por LINHA (lido de `lines` + `structure`) */}
                {lines.length === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '14px', fontWeight: 500, padding: '16px' }}>
                        Nenhuma linha cadastrada. Crie linhas na aba "Produtos / Medidas" primeiro.
                    </div>
                )}
                {lines.map(line => {
                    const cats = structure[line] || []
                    const totalConfigured = cats.reduce((sum, { category }) => {
                        return sum + (activeAlumColorsByKey[`${line}|${category}`] || []).length
                    }, 0)
                    return (
                        <div key={line} style={{
                            background: 'white',
                            borderRadius: '24px', border: '1px solid rgba(229, 231, 235, 0.8)',
                            overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                            display: 'flex', flexDirection: 'column'
                        }}>
                            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', borderBottom: '1px solid #F3F4F6' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #172256 0%, #25337a 100%)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(112,66,20,0.25)' }}>
                                    <Pipette size={22} />
                                </div>
                                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--color-navy-900)', textAlign: 'center', letterSpacing: '-0.3px' }}>{line.toUpperCase()}</span>
                                <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
                                    {cats.length} {cats.length === 1 ? 'categoria' : 'categorias'}
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: totalConfigured > 0 ? '#92400E' : '#9CA3AF' }}>
                                    {totalConfigured} {totalConfigured === 1 ? 'cor configurada' : 'cores configuradas'}
                                </span>
                            </div>
                            <div style={{ padding: '16px' }}>
                                <button
                                    onClick={() => setActiveAlumLine(line)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', border: 'none', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'transform 0.1s', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Ver Categorias e Cores <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
