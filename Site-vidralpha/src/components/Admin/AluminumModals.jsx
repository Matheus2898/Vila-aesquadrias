import React from 'react'
import { X, Pipette, Loader2, Trash2, Check } from 'lucide-react'
import CostField from '../CostField'

export function AluminumModal({
    activeLine,
    onClose,
    structure,
    activeAlumColorsByKey,
    alumColors,
    alumColorCosts,
    pendingAlumCosts,
    setPendingAlumCosts,
    setSelectingAlumColorsFor,
    setActiveAlumColorsByKey,
    handleBatchSaveAlumCosts,
    isSaving
}) {
    if (!activeLine) return null

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                data-lenis-prevent="true"
                style={{ background: '#F8FAFC', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                {/* Header */}
                <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', background: 'white', borderRadius: '24px 24px 0 0', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #172256 0%, #25337a 100%)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pipette size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-navy-900)', margin: 0 }}>{activeLine}</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>Selecione as cores e defina os custos adicionais por categoria</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', cursor: 'pointer', color: '#64748B', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="custom-scrollbar" style={{ flex: 1, padding: '32px', overflowY: 'auto', minHeight: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        {(structure[activeLine] || []).map(({ category }) => {
                            const catKey = `${activeLine}|${category}`
                            const selectedColors = activeAlumColorsByKey[catKey] || []
                            return (
                                <div key={category} style={{ background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #F1F5F9' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '8px', height: '24px', background: 'linear-gradient(135deg, #172256 0%, #25337a 100%)', borderRadius: '4px' }} />
                                            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-navy-900)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{category}</span>
                                            <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
                                                {selectedColors.length} {selectedColors.length === 1 ? 'cor' : 'cores'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setSelectingAlumColorsFor(catKey)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: 'var(--color-navy-900)' }}
                                        >
                                            <Pipette size={14} /> Selecionar Cores
                                        </button>
                                    </div>

                                    {selectedColors.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#94A3B8', padding: '20px', fontSize: '13px', fontWeight: 500, background: '#F8FAFC', borderRadius: '12px', border: '1.5px dashed #E2E8F0' }}>
                                            Selecione as cores disponíveis para esta categoria.
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                                            {selectedColors.map(colorName => {
                                                const alumColor = alumColors.find(c => c.name === colorName)
                                                if (!alumColor) return null
                                                const costKey = `${catKey}|${colorName}`
                                                return (
                                                    <div key={colorName} style={{ background: '#FAFAF8', border: `1.5px solid ${alumColor.hex_code ? alumColor.hex_code + '55' : '#E8E8E0'}`, borderRadius: '12px', padding: '14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: alumColor.hex_code || '#CCC', border: '2px solid rgba(0,0,0,0.15)' }} />
                                                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>{alumColor.name}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setActiveAlumColorsByKey(prev => ({ ...prev, [catKey]: (prev[catKey] || []).filter(c => c !== colorName) }))
                                                                    setPendingAlumCosts(prev => { const n = { ...prev }; delete n[costKey]; return n })
                                                                }}
                                                                style={{ color: '#EF4444', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                        <CostField
                                                            hideButton={true}
                                                            value={pendingAlumCosts[costKey] !== undefined ? pendingAlumCosts[costKey] : (alumColorCosts[costKey] ?? null)}
                                                            onChange={(v) => setPendingAlumCosts(prev => ({ ...prev, [costKey]: v }))}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 32px', borderTop: '1px solid #E2E8F0', background: 'white', borderRadius: '0 0 24px 24px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                    <button
                        onClick={handleBatchSaveAlumCosts}
                        disabled={isSaving}
                        style={{ padding: '14px 32px', background: 'var(--color-navy-900)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', opacity: isSaving ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isSaving && <Loader2 className="animate-spin" size={18} />}
                        {Object.keys(pendingAlumCosts).length > 0 ? `Salvar (${Object.keys(pendingAlumCosts).length})` : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export function SelectingAlumColorsModal({
    show,
    onClose,
    targetKey,
    colors,
    activeList,
    onToggle
}) {
    if (!show || !targetKey) return null

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div
                onWheel={(e) => { e.stopPropagation() }}
                data-lenis-prevent="true"
                style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '400px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Selecionar Cores (Alumínio)</h3>
                <div className="custom-scrollbar" style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {colors.map(c => {
                        const active = activeList.includes(c.name)
                        return (
                            <button
                                key={c.id}
                                onClick={() => onToggle(targetKey, c.name)}
                                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', border: active ? '2px solid var(--color-navy-900)' : '1px solid #E2E8F0', background: active ? '#F1F5F9' : 'white', cursor: 'pointer' }}
                            >
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: c.hex_code || '#CCC', border: '1px solid rgba(0,0,0,0.1)' }} />
                                <span style={{ flex: 1, fontSize: '14px', fontWeight: active ? 700 : 500, color: active ? 'var(--color-navy-900)' : '#64748B', textAlign: 'left' }}>{c.name}</span>
                                {active && <Check size={18} color="var(--color-navy-900)" />}
                            </button>
                        )
                    })}
                </div>
                <button onClick={onClose} style={{ width: '100%', marginTop: '24px', padding: '14px', background: 'var(--color-navy-900)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>Concluir</button>
            </div>
        </div>
    )
}
