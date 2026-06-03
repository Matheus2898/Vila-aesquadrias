import React from 'react'
import { X, Plus, Loader2, Palette, Pipette } from 'lucide-react'

export function GlobalColorsModal({
    show,
    onClose,
    colors,
    newColorName,
    setNewColorName,
    newColorHex,
    setNewColorHex,
    handleAddColor,
    handleDeleteColor,
    addingColor,
    modalRef
}) {
    if (!show) return null
    return (
        <div
            onWheel={(e) => { if (modalRef?.current) { modalRef.current.scrollBy({ top: e.deltaY, behavior: 'smooth' }); e.preventDefault() } }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                data-lenis-prevent="true"
                style={{ background: '#F8FAFC', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', background: 'white', borderRadius: '24px 24px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--color-navy-900)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Palette size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy-900)', margin: 0 }}>Cores de Vidro Globais</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>Gerencie as cores que podem ser associadas aos vidros.</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
                </div>

                <div ref={modalRef} className="custom-scrollbar" style={{ flex: 1, minHeight: 0, padding: '32px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                            <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} style={{ width: '48px', height: '48px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: 'transparent' }} />
                            <input
                                type="text"
                                value={newColorHex}
                                onChange={e => setNewColorHex(e.target.value)}
                                placeholder="#000000"
                                style={{ width: '90px', padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontFamily: 'monospace', textAlign: 'center' }}
                            />
                            <input type="text" placeholder="Nome da cor" value={newColorName} onChange={e => setNewColorName(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1' }} />
                            <button onClick={handleAddColor} disabled={addingColor || !newColorName.trim()} style={{ padding: '12px 24px', background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', opacity: addingColor ? 0.6 : 1 }}>
                                {addingColor ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                            {colors.map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white' }}>
                                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: c.hex_code || '#CCC', border: '1px solid rgba(0,0,0,0.1)' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155', flex: 1 }}>{c.name}</span>
                                    <button onClick={() => handleDeleteColor(c.name)} style={{ background: 'none', border: 'none', color: '#EF4444', opacity: 0.5, cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

export function GlobalAlumColorsModal({
    show,
    onClose,
    colors,
    newColorName,
    setNewColorName,
    newColorHex,
    setNewColorHex,
    handleAddColor,
    handleDeleteColor,
    addingColor,
    modalRef
}) {
    if (!show) return null
    return (
        <div
            onWheel={(e) => { if (modalRef?.current) { modalRef.current.scrollBy({ top: e.deltaY, behavior: 'smooth' }); e.preventDefault() } }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div
                data-lenis-prevent="true"
                style={{ background: '#F8FAFC', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', background: 'white', borderRadius: '24px 24px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #172256 0%, #25337a 100%)', color: 'var(--color-amber-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Pipette size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-navy-900)', margin: 0 }}>Cores de Perfil de Alumínio</h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748B' }}>Gerencie as cores globais de alumínio.</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', color: '#64748B' }}><X size={20} /></button>
                </div>

                <div ref={modalRef} className="custom-scrollbar" style={{ flex: 1, minHeight: 0, padding: '32px', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '20px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                            <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} style={{ width: '48px', height: '48px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: 'transparent' }} />
                            <input
                                type="text"
                                value={newColorHex}
                                onChange={e => setNewColorHex(e.target.value)}
                                placeholder="#000000"
                                style={{ width: '90px', padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1', fontSize: '13px', fontFamily: 'monospace', textAlign: 'center' }}
                            />
                            <input type="text" placeholder="Nome da cor" value={newColorName} onChange={e => setNewColorName(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #CBD5E1' }} />
                            <button onClick={handleAddColor} disabled={addingColor || !newColorName.trim()} style={{ padding: '12px 24px', background: 'var(--color-amber-500)', color: 'var(--color-navy-900)', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', opacity: addingColor ? 0.6 : 1 }}>
                                {addingColor ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {colors.map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '999px', border: '1px solid #E2E8F0', background: 'white' }}>
                                    <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: c.hex_code || '#CCC', border: '1px solid rgba(0,0,0,0.1)' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{c.name}</span>
                                    <button onClick={() => handleDeleteColor(c.name)} style={{ background: 'none', border: 'none', color: '#EF4444', opacity: 0.5, cursor: 'pointer' }}><X size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
