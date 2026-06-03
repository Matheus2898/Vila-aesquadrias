import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'

// ─── Utils ───────────────────────────────────────────────────────────────────
const fmtCurrency = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return 'R$ 0,00'
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
const parseBRL = (s = '') =>
    parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.')) || 0

const INPUT_STYLE = {
    width: '100%', paddingLeft: '36px', paddingRight: '12px',
    paddingTop: '10px', paddingBottom: '10px',
    borderRadius: '8px', border: '1.5px solid #E0E0D8',
    fontSize: '14px', fontWeight: 600, color: '#1a1a2e',
    background: 'white', outline: 'none', boxSizing: 'border-box',
}

// ─── Sub-componente: campo de custo editável ─────────────────────────────────
export default function CostField({ value, onSave, hideButton, onChange }) {
    const [raw, setRaw] = useState('')
    const [focused, setFocused] = useState(false)
    const [saving, setSaving] = useState(false)
    const [ok, setOk] = useState(false)

    useEffect(() => {
        if (!focused && hideButton && value != null) {
            // eslint-disable-next-line
            setRaw(String(value).replace('.', ','))
        }
    }, [value, focused, hideButton])

    const displayVal = focused
        ? raw
        : value != null ? fmtCurrency(value).replace('R$\u00a0', '').replace('R$ ', '') : ''

    const doSave = async () => {
        if (hideButton) return
        setSaving(true)
        await onSave(parseBRL(raw))
        setSaving(false)
        setOk(true)
        setTimeout(() => setOk(false), 2000)
        setFocused(false)
    }

    const handleChange = e => {
        setRaw(e.target.value)
        if (hideButton && onChange) {
            onChange(parseBRL(e.target.value))
        }
    }

    return (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', fontSize: '12px', color: '#AAA', pointerEvents: 'none'
                }}>R$</span>
                <input
                    type="text"
                    value={displayVal}
                    placeholder="0,00"
                    style={{
                        ...INPUT_STYLE,
                        borderColor: focused ? 'var(--color-amber-500)' : '#E0E0D8'
                    }}
                    onFocus={() => {
                        setFocused(true)
                        setRaw(value != null ? String(value).replace('.', ',') : '')
                    }}
                    onChange={handleChange}
                    onKeyDown={e => { if (e.key === 'Enter') doSave() }}
                    onBlur={() => {
                        if (!raw) setFocused(false)
                        else if (hideButton) setFocused(false)
                    }}
                />
            </div>
            {!hideButton && (
                <button
                    onClick={doSave}
                    disabled={saving}
                    style={{
                        width: '40px', height: '40px', flexShrink: 0, border: 'none',
                        borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: ok ? '#ECFDF5' : focused ? 'var(--color-amber-500)' : '#F5F5F0',
                        color: ok ? '#15803D' : focused ? 'var(--color-navy-900)' : '#999',
                        transition: 'all 0.2s',
                    }}
                >
                    {saving ? <Loader2 size={15} className="animate-spin" />
                        : ok ? <CheckCircle2 size={15} />
                            : <Save size={15} />}
                </button>
            )}
        </div>
    )
}
