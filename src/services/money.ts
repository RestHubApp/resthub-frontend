// Montos en soles, como se escriben en el Perú: "S/ 28.00".
//
// El API manda los montos como texto decimal ("28.00") para no perder
// centavos en el camino. Se convierten a número solo para mostrarlos.

const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' })

const PORCENTAJE = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })

/** "S/ 28.00". Un valor que no es número se muestra como un guion. */
export function formatMoney(value: string | number): string {
  const numero = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numero) ? SOLES.format(numero) : '—'
}

/** "72.7 %". El API ya manda el porcentaje multiplicado por cien. */
export function formatPercent(value: string | number): string {
  const numero = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numero) ? `${PORCENTAJE.format(numero)} %` : '—'
}
