import React from 'react'
import { X, Plus, Trash2, Loader2, Pipette, Check } from 'lucide-react'
import CostField from '../CostField'

export function NewGlassTypeModal({
    show,
    onClose,
    newGlassTypeName,
    setNewGlassTypeName,
    newGlassThickInput,
    setNewGlassThickInput,
    handleGlassModalAddThick,
    newGlassThicknesses,
    handleGlassModalRemoveThick,
    addGlassType,
    loading
}) {
    if (!show) return null

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div
                onWheel={(e) => { e.stopPropagation() }}
                data-lenis-prevent="true"
                style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-navy-900)' }}>Novo Tipo de Vidro</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Nome (Ex: Incolor, Verde, Temperado...)</label>
                        <input
                            type="text"
                            value={newGlassTypeName}
                            onChange={e => setNewGlassTypeName(e.target.value)}
                            placeholder="Nome do tipo de vidro"
                            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #E2E8F0' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Espessuras (Ex: 6mm, 8mm, 10mm)</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                            <input
                                type="text"
                                value={newGlassThickInput}
                                onChange={e => setNewGlassThickInput(e.target.value)}
                                placeholder="Ex: 8mm"
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #E2E8F0' }}
                            />
                            <button onClick={handleGlassModalAddThick} style={{ padding: '0 16px', background: 'var(--color-navy-900)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {newGlassThicknesses.map(t => (
                                <span key={t} style={{ background: '#F1F5F9', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {t} <X size={14} style={{ cursor: 'pointer' }} onClick={() => handleGlassModalRemoveThick(t)} />
                                </span>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={addGlassType}
                        disabled={loading || !newGlassTypeName || newGlassThicknesses.length === 0}
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: '12px', opacity: (loading || !newGlassTypeName || newGlassThicknesses.length === 0) ? 0.6 : 1 }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Tipo de Vidro'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export function GlassModal({
    activeGlass,
    onClose,
    glassTypesList,
    pendingGlassCosts,
    setPendingGlassCosts,
    glassTypeCosts,
    activeColorsByThick,
    colorCosts,
    setSelectingColorsFor,
    handleDeleteThickness,
    handleDeleteColorCost,
    handleBatchSaveGlassCosts,
    isSaving,
    colors,
    setShowNewThickModal,
    showNewThickModal,
    newThickValue,
    setNewThickValue,
    addThickness
}) {
    const modalBodyRef = React.useRef(null)
    if (!activeGlass) return null

    const currentGlass = glassTypesList.find(g => g.type === activeGlass)
    if (!currentGlass) return null

    return (
        <div
            onWheel={(e) => { if (modalBodyRef.current) { modalBodyRef.current.scrollBy({ top: e.deltaY, behavior: 'smooth' }); e.preventDefault() } }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div
                data-lenis-prevent="true"
                style={{ background: '#F8FAFC', borderRadius: '24px', width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-navy-900)', color: 'white', borderRadius: '24px 24px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Vidro {activeGlass}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div ref={modalBodyRef} className="custom-scrollbar" style={{ padding: '32px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                        <button onClick={() => setShowNewThickModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                            <Plus size={18} /> Nova Espessura
                        </button>
                    </div>

                    {showNewThickModal && (
                        <div style={{ padding: '20px', background: 'white', borderRadius: '16px', border: '1.5px solid #F1F5F9', marginBottom: '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-navy-900)' }}>Adicionar Nova Espessura (Vidro {activeGlass})</h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    type="text"
                                    value={newThickValue}
                                    onChange={e => setNewThickValue(e.target.value)}
                                    placeholder="Ex: 8mm"
                                    style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #E2E8F0' }}
                                />
                                <button onClick={addThickness} style={{ padding: '0 24px', background: 'var(--color-navy-900)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
                                <button onClick={() => setShowNewThickModal(false)} style={{ padding: '0 16px', background: 'none', border: 'none', color: '#64748B', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {currentGlass.thicknesses.map(thick => {
                            const typeKey = `${activeGlass}|${thick}`
                            const activeColors = activeColorsByThick[typeKey] || []
                            return (
                                <div key={thick} style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
                                    <div style={{ padding: '20px 24px', background: '#F8FAFC', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-navy-900)' }}>Espessura {thick}</span>
                                            <button onClick={() => handleDeleteThickness(thick)} style={{ color: '#EF4444', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none' }}><Trash2 size={14} /></button>
                                        </div>
                                        <button onClick={() => setSelectingColorsFor(typeKey)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-900)', cursor: 'pointer' }}>
                                            <Pipette size={14} /> Selecionar Cores
                                        </button>
                                    </div>

                                    <div style={{ padding: '24px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                                            {/* Custo Base (Incolor / Sem Cor) */}
                                            <div style={{ background: '#F1F5F9', borderRadius: '16px', padding: '20px' }}>
                                                <div style={{ marginBottom: '12px', fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Custo Base (m²)</div>
                                                <CostField
                                                    hideButton={true}
                                                    value={pendingGlassCosts[typeKey] !== undefined ? pendingGlassCosts[typeKey] : (glassTypeCosts[typeKey] ?? null)}
                                                    onChange={(v) => setPendingGlassCosts(prev => ({ ...prev, [typeKey]: v }))}
                                                />
                                            </div>

                                            {/* Custos por Cor */}
                                            {activeColors.map(colorName => {
                                                const fullKey = `${typeKey}|${colorName}`
                                                const color = colors.find(c => c.name === colorName)
                                                return (
                                                    <div key={colorName} style={{ background: 'white', border: '1.5px solid #F1F5F9', borderRadius: '16px', padding: '20px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color?.hex_code || '#CCC' }} />
                                                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>{colorName}</span>
                                                            </div>
                                                            <button onClick={() => handleDeleteColorCost(activeGlass, thick, colorName)} style={{ color: '#EF4444', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none' }}><Trash2 size={12} /></button>
                                                        </div>
                                                        <CostField
                                                            hideButton={true}
                                                            value={pendingGlassCosts[fullKey] !== undefined ? pendingGlassCosts[fullKey] : (colorCosts[fullKey] ?? null)}
                                                            onChange={(v) => setPendingGlassCosts(prev => ({ ...prev, [fullKey]: v }))}
                                                        />
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div style={{ padding: '24px 32px', borderTop: '1px solid #F1F5F9', background: 'white', borderRadius: '0 0 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    <button
                        onClick={handleBatchSaveGlassCosts}
                        disabled={isSaving}
                        style={{ padding: '12px 32px', borderRadius: '12px', background: 'var(--color-navy-900)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: isSaving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isSaving && <Loader2 size={18} className="animate-spin" />}
                        {Object.keys(pendingGlassCosts).length > 0 ? `Salvar (${Object.keys(pendingGlassCosts).length})` : 'Salvar'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export function SelectingColorsModal({
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
                <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>Selecionar Cores</h3>
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
