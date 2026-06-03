export const fmtCurrency = (v) => {
    const n = parseFloat(v)
    if (isNaN(n)) return 'R$ 0,00'
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const parseBRL = (s = '') =>
    parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.')) || 0
