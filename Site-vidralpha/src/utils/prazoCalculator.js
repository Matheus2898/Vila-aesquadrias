// ============================================================================
// prazoCalculator.js
// Utilitário frontend para calcular o prazo escalonado de produção.
// Usado no checkout para mostrar o prazo estimado ao cliente ANTES de confirmar.
// A lógica real (com chamada à Lalamove) fica na Edge Function lalamove-checkout.
// ============================================================================

/**
 * Adiciona N dias úteis (segunda–sexta) a uma data.
 * @param {Date} dataInicio - Data base
 * @param {number} dias - Quantidade de dias úteis a adicionar
 * @returns {Date} Nova data com os dias úteis adicionados
 */
export function adicionarDiasUteis(dataInicio, dias) {
  const data = new Date(dataInicio.getTime())
  let contador = 0

  while (contador < dias) {
    data.setDate(data.getDate() + 1)
    const diaSemana = data.getDay()
    // 0 = Domingo, 6 = Sábado — pular fins de semana
    if (diaSemana !== 0 && diaSemana !== 6) {
      contador++
    }
  }

  return data
}

/**
 * Calcula o prazo final de produção em dias úteis para um único item.
 * Fórmula: prazo_base + ((quantidade - 1) * dias_extras_por_unidade)
 *
 * @param {object} item - Item do carrinho
 * @param {number} item.prazo_base - Dias úteis base para 1 unidade
 * @param {number} item.dias_extras_por_unidade - Dias extras por unidade adicional
 * @param {number} item.quantity - Quantidade comprada
 * @returns {number} Prazo em dias úteis para este item
 */
export function calcularPrazoItem({ prazo_base = 5, dias_extras_por_unidade = 1, quantity = 1 }) {
  const prazo = prazo_base + ((quantity - 1) * dias_extras_por_unidade)
  return Math.max(1, prazo) // mínimo de 1 dia útil
}

/**
 * Calcula o prazo final do pedido completo (múltiplos itens).
 * Regra: adota o MAIOR prazo dentre todos os itens do carrinho.
 *
 * @param {Array<{prazo_base: number, dias_extras_por_unidade: number, quantity: number}>} itens
 * @returns {number} Prazo máximo em dias úteis (prazo oficial do pedido)
 */
export function calcularPrazoFinalPedido(itens) {
  if (!itens || itens.length === 0) return 5 // fallback padrão

  const prazos = itens.map(item => calcularPrazoItem(item))
  return Math.max(...prazos)
}

/**
 * Retorna a data estimada de coleta formatada para exibição ao cliente.
 *
 * @param {Array} itensPedido - Itens do carrinho com campos de prazo
 * @returns {{ prazoEmDias: number, dataColeta: Date, dataFormatada: string, scheduleAtISO: string }}
 */
export function getInfoPrazoEntrega(itensPedido) {
  const prazoEmDias = calcularPrazoFinalPedido(itensPedido)

  // Data de coleta: prazo a partir de hoje, às 09:00 (horário local)
  const hoje = new Date()
  const dataColeta = adicionarDiasUteis(hoje, prazoEmDias)
  dataColeta.setHours(9, 0, 0, 0)

  // Versão UTC para enviar à Lalamove (09:00 BRT = 12:00 UTC)
  const dataColetaUTC = new Date(dataColeta.getTime())
  dataColetaUTC.setUTCHours(12, 0, 0, 0)

  const dataFormatada = dataColeta.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     '2-digit',
    month:   'long',
    year:    'numeric',
  })

  return {
    prazoEmDias,
    dataColeta,
    dataFormatada,
    scheduleAtISO: dataColetaUTC.toISOString(),
  }
}

/**
 * Formata uma duração em dias úteis para exibição amigável ao usuário.
 * Ex: 5 → "5 dias úteis" | 1 → "1 dia útil"
 *
 * @param {number} dias
 * @returns {string}
 */
export function formatarPrazo(dias) {
  return dias === 1 ? '1 dia útil' : `${dias} dias úteis`
}
