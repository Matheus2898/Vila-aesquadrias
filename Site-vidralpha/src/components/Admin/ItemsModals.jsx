import React from 'react'
import { X, Plus, Trash2, Loader2, Save, Layers, ChevronDown } from 'lucide-react'
import CustomDropdown from '../CustomDropdown'
import CostField from '../CostField'

export function NewLineModal({
    show,
    onClose,
    newLineName,
    setNewLineName,
    newLineTipoVenda,
    setNewLineTipoVenda,
    newLineCatName,
    setNewLineCatName,
    newLineCats,
    handleModalAddCat,
    handleModalRemoveCat,
    newLineMeasureInputs,
    setNewLineMeasureInputs,
    handleModalAddMeasure,
    handleModalRemoveMeasure,
    handleModalSubmit,
    loading,
    newLineType,
    setNewLineType,
    newLineAccessoryType,
    setNewLineAccessoryType
}) {
    if (!show) return null

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div
                onWheel={(e) => { e.stopPropagation() }}
                data-lenis-prevent="true"
                style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-navy-900)' }}>Criar Nova Linha</h2>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}><X size={18} /></button>
                </div>
                <div className="custom-scrollbar" style={{ padding: '24px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Nome da Linha</label>
                            <input
                                type="text"
                                value={newLineName}
                                onChange={e => setNewLineName(e.target.value)}
                                placeholder="Ex: Linha Gold, Linha Suprema..."
                                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #E2E8F0' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Tipo de Produto desta Linha</label>
                            <CustomDropdown
                                value={newLineType}
                                onChange={val => setNewLineType(val)}
                                options={[
                                    { value: 'esquadria', label: 'Esquadria (Portas, Janelas, etc)' },
                                    { value: 'acessorio', label: 'Acessórios (Puxadores, Fechaduras)' },
                                    { value: 'vidro', label: 'Vidros Avulsos' },
                                    { value: 'padrao', label: 'Produto Padrão / Comum' }
                                ]}
                            />
                        </div>

                        {newLineType !== 'esquadria' ? (
                            newLineType === 'acessorio' ? (
                                <div style={{ padding: '20px', background: 'rgba(245,158,11,0.08)', borderRadius: '16px', border: '1.5px dashed rgba(245,158,11,0.4)' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: '#92400E' }}>Compatibilidade do Acessório (Opcional)</label>
                                    <CustomDropdown
                                        value={newLineAccessoryType}
                                        onChange={val => setNewLineAccessoryType(val)}
                                        options={[
                                            { value: 'Nenhum', label: 'Nenhum / Universal' },
                                            { value: 'Gold', label: 'Gold' },
                                            { value: 'Suprema', label: 'Suprema' }
                                        ]}
                                    />
                                </div>
                            ) : null
                        ) : (
                            <>
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>Tipo de Venda</label>
                                    <CustomDropdown
                                        value={newLineTipoVenda}
                                        onChange={val => setNewLineTipoVenda(val)}
                                        options={[
                                            { value: 'medida', label: 'Por Medida (Variável)' },
                                            { value: 'unidade', label: 'Por Unidade (Fixo)' },
                                            { value: 'm2', label: 'Por Metro Quadrado (m²)' }
                                        ]}
                                    />
                                </div>

                                <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1.5px dashed #E2E8F0' }}>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Categorias e Medidas</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <input
                                            type="text"
                                            value={newLineCatName}
                                            onChange={e => setNewLineCatName(e.target.value)}
                                            placeholder="Nome da Categoria (Ex: Janela 2 Folhas)"
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1.5px solid #E2E8F0' }}
                                        />
                                        <button onClick={handleModalAddCat} style={{ padding: '0 16px', background: 'var(--color-navy-900)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Add Cat</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {newLineCats.map((c, idx) => (
                                            <div key={idx} style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: newLineTipoVenda === 'medida' ? '12px' : '0' }}>
                                                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{c.category}</span>
                                                    <button onClick={() => handleModalRemoveCat(newLineName, c.category)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                </div>
                                                {newLineTipoVenda === 'medida' && (
                                                    <>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                                            {c.measures.map(m => (
                                                                <span key={m} style={{ background: '#F1F5F9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    {m} <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleModalRemoveMeasure(newLineName, c.category, m)} />
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <input
                                                                type="text"
                                                                value={newLineMeasureInputs[`${newLineName}|${c.category}`] || ''}
                                                                onChange={e => setNewLineMeasureInputs(prev => ({ ...prev, [`${newLineName}|${c.category}`]: e.target.value }))}
                                                                placeholder="Add medida (Ex: 100X120)"
                                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1.5px solid #E2E8F0', fontSize: '13px' }}
                                                            />
                                                            <button onClick={() => handleModalAddMeasure(newLineName, c.category)} style={{ padding: '0 12px', background: '#E2E8F0', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>+</button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ padding: '24px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    <button
                        onClick={handleModalSubmit}
                        disabled={loading || !newLineName || (newLineType === 'esquadria' && newLineCats.length === 0)}
                        style={{ padding: '12px 32px', borderRadius: '12px', background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: (loading || !newLineName || (newLineType === 'esquadria' && newLineCats.length === 0)) ? 0.6 : 1 }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Criar Linha'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export function LineModal({
    activeLine,
    onClose,
    structure,
    pendingModalCosts,
    setPendingModalCosts,
    costs,
    onSaveBatch,
    isSaving,
    setShowNewCatInlineModal,
    showNewCatInlineModal,
    newCatInlineName,
    setNewCatInlineName,
    handleAddInlineCat,
    setShowNewMeasureModal,
    showNewMeasureModal,
    newMeasureW,
    setNewMeasureW,
    newMeasureH,
    setNewMeasureH,
    addMeasure,
    removeMeasure,
    handleDeleteCategory
}) {
    const modalBodyRef = React.useRef(null)
    if (!activeLine) return null

    return (
        <div
            onWheel={(e) => { if (modalBodyRef.current) { modalBodyRef.current.scrollBy({ top: e.deltaY, behavior: 'smooth' }); e.preventDefault() } }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div
                data-lenis-prevent="true"
                style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-navy-900)', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Layers size={24} color="var(--color-amber-500)" />
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Linha {activeLine}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'white' }}><X size={18} /></button>
                </div>

                <div ref={modalBodyRef} className="custom-scrollbar" style={{ padding: '32px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                        <button onClick={() => setShowNewCatInlineModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                            <Plus size={18} /> Nova Categoria
                        </button>
                    </div>

                    {showNewCatInlineModal && (
                        <div style={{ padding: '20px', background: '#F8FAFC', borderRadius: '16px', border: '1.5px solid #E2E8F0', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Nova Categoria na {activeLine}</h3>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    type="text"
                                    value={newCatInlineName}
                                    onChange={e => setNewCatInlineName(e.target.value)}
                                    placeholder="Nome da categoria..."
                                    style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1' }}
                                />
                                <button onClick={handleAddInlineCat} style={{ padding: '0 24px', background: 'var(--color-navy-900)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
                                <button onClick={() => setShowNewCatInlineModal(false)} style={{ padding: '0 16px', background: 'white', color: '#64748B', border: '1.5px solid #E2E8F0', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {(structure[activeLine] || []).map((s, idx) => (
                            <div key={idx} style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #F1F5F9', overflow: 'hidden' }}>
                                <div style={{ padding: '16px 24px', background: '#F8FAFC', borderBottom: '1.5px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--color-navy-900)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.category}</span>
                                        <button onClick={() => handleDeleteCategory(activeLine, s.category)} style={{ display: 'flex', alignItems: 'center', color: '#EF4444', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5} title="Excluir Categoria">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <button onClick={() => setShowNewMeasureModal(s.category)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-navy-900)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Plus size={16} /> Add Medida
                                    </button>
                                </div>

                                <div style={{ padding: '24px' }}>
                                    {showNewMeasureModal === s.category && (
                                        <div style={{ padding: '16px', background: '#F1F5F9', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <input type="text" value={newMeasureW} onChange={e => setNewMeasureW(e.target.value)} placeholder="L" style={{ width: '60px', padding: '8px', borderRadius: '8px', border: '1.5px solid #CBD5E1', textAlign: 'center' }} />
                                            <span>X</span>
                                            <input type="text" value={newMeasureH} onChange={e => setNewMeasureH(e.target.value)} placeholder="A" style={{ width: '60px', padding: '8px', borderRadius: '8px', border: '1.5px solid #CBD5E1', textAlign: 'center' }} />
                                            <button onClick={() => addMeasure(s.category)} style={{ padding: '8px 16px', background: 'var(--color-navy-900)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Adicionar</button>
                                            <button onClick={() => setShowNewMeasureModal(null)} style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                                        {s.measures.map(measure => {
                                            const key = `${activeLine}|${s.category}|${measure}`
                                            return (
                                                <div key={measure} style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '16px', padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>{measure}</span>
                                                        <button onClick={() => removeMeasure(s.category, measure)} style={{ color: '#EF4444', opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <CostField
                                                        hideButton={true}
                                                        value={pendingModalCosts[key] !== undefined ? pendingModalCosts[key] : (costs[key] ?? null)}
                                                        onChange={(v) => setPendingModalCosts(prev => ({ ...prev, [key]: v }))}
                                                    />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ padding: '24px', borderTop: '1px solid #F1F5F9', background: 'white', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', border: '1.5px solid #E2E8F0', background: 'white', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                    <button
                        onClick={onSaveBatch}
                        disabled={isSaving}
                        style={{ padding: '12px 32px', borderRadius: '12px', background: 'var(--color-navy-900)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: isSaving ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        {isSaving && <Loader2 size={18} className="animate-spin" />}
                        {Object.keys(pendingModalCosts).length > 0 ? `Salvar (${Object.keys(pendingModalCosts).length})` : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    )
}
