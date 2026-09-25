// Los formatos de toda la aplicación: soles, porcentajes, cantidades de
// insumo, fechas y horas, como se escriben en el Perú.
//
// El API manda montos y cantidades como texto decimal ("28.00") para no
// perder céntimos en un `float`. Se convierten a número solo para mostrarlos;
// las sumas del carrito se hacen en céntimos enteros por la misma razón.

const LOCALE = 'es-PE'

/** La zona del restaurante mientras la sesión no la informe. */
export const DEFAULT_TIME_ZONE = 'America/Lima'

const SOLES = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'PEN' })
const SOLES_COMPACT = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'PEN',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const INTEGER = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const ONE_DECIMAL = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const TWO_DECIMALS = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })
// Un kilo o un litro se cuenta hasta el gramo: 1.125 kg no es 1.13 kg.
const THREE_DECIMALS = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 })

const CENTS = 100
const THOUSAND = 1000
const PERCENT = 100
const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const NO_VALUE = '—'

/** Un monto o cantidad del API como número; lo que no es número, cero. */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0
  }
  const numero = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(numero) ? numero : 0
}

function finite(value: string | number): number | null {
  const numero = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numero) ? numero : null
}

// ---------------------------------------------------------------- Dinero

/** `S/ 1,234.50`. Un valor que no es número se muestra como un guion. */
export function formatMoney(value: string | number): string {
  const numero = finite(value)
  return numero === null ? NO_VALUE : SOLES.format(numero)
}

/** Para los ejes de un gráfico: `S/ 850` o `S/ 2.5 K`. */
export function formatMoneyCompact(value: number): string {
  return value < THOUSAND ? SOLES.format(value).replace(/\.00$/u, '') : SOLES_COMPACT.format(value)
}

export function toCents(value: string | number): number {
  return Math.round(toNumber(value) * CENTS)
}

export function formatCents(cents: number): string {
  return formatMoney(cents / CENTS)
}

/** El monto en el formato que espera el API: `100.00`. */
export function centsToApi(cents: number): string {
  return (cents / CENTS).toFixed(2)
}

// ---------------------------------------------------------------- Números

export function formatInteger(value: string | number): string {
  return INTEGER.format(toNumber(value))
}

/** `65.6 %`. El API ya manda el porcentaje multiplicado por cien. */
export function formatPercent(value: string | number): string {
  const numero = finite(value)
  return numero === null ? NO_VALUE : `${ONE_DECIMAL.format(numero)} %`
}

/** `+2.5 %` o `−0.9 %`, con el signo siempre escrito. */
export function formatChange(value: string | number): string {
  const numero = toNumber(value)
  const signos: Record<number, string> = { 1: '+', [-1]: '−' }
  return `${signos[Math.sign(numero)] ?? ''}${ONE_DECIMAL.format(Math.abs(numero))} %`
}

/** Una confianza de 0 a 1 como porcentaje entero: `87 %`. */
export function formatConfidence(value: number | null): string {
  return value === null ? 'Sin dato' : `${INTEGER.format(value * PERCENT)} %`
}

/** `0.7 días`, `1 día`. */
export function formatDays(value: string | number): string {
  const numero = toNumber(value)
  return `${TWO_DECIMALS.format(numero)} ${numero === 1 ? 'día' : 'días'}`
}

// ---------------------------------------------------------------- Cantidades

const BASE_LABELS: Readonly<Partial<Record<string, string>>> = { g: 'g', ml: 'ml', unit: 'unid.' }
const LARGE_LABELS: Readonly<Partial<Record<string, string>>> = { g: 'kg', ml: 'L' }

/**
 * Una cantidad de insumo en su unidad base (`g`, `ml` o `unit`), legible:
 * desde mil gramos o mililitros pasa a kg o L. `5600 g` → `5.6 kg`, `5 unit` → `5 unid.`.
 */
export function formatQuantity(value: string | number, unit: string): string {
  const numero = finite(value)
  if (numero === null) {
    return NO_VALUE
  }
  const grande = LARGE_LABELS[unit]
  if (grande !== undefined && Math.abs(numero) >= THOUSAND) {
    return `${THREE_DECIMALS.format(numero / THOUSAND)} ${grande}`
  }
  return `${TWO_DECIMALS.format(numero)} ${BASE_LABELS[unit] ?? unit}`
}

/** Con signo siempre visible, para el libro de movimientos: `+5 kg`, `−150 g`. */
export function formatSignedQuantity(value: string | number, unit: string): string {
  const numero = toNumber(value)
  const texto = formatQuantity(Math.abs(numero), unit)
  return numero < 0 ? `−${texto}` : `+${texto}`
}

// ---------------------------------------------------------------- Fechas y horas

/** El día de hoy en la zona del restaurante, como `2026-09-25`. */
export function todayIn(timeZone: string): string {
  // en-CA escribe las fechas como AAAA-MM-DD, que es el formato del API.
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date())
}

/** Un instante en la zona del restaurante: `2:05 p. m.` */
export function formatTime(isoDateTime: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short', timeZone }).format(new Date(isoDateTime))
}

/** Un instante en la zona del restaurante: `25 set. 2026, 2:05 p. m.` */
export function formatDateTime(isoDateTime: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(
    new Date(isoDateTime),
  )
}

// Un día del local (`2026-09-18`) no tiene hora: se lee en UTC para que la
// zona del navegador no lo corra al día anterior.
function localDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`)
}

const SHORT_DAY = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' })
const LONG_DAY = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** `18 set.` */
export function formatShortDate(isoDate: string): string {
  return SHORT_DAY.format(localDay(isoDate))
}

/** `viernes, 18 de septiembre de 2026` */
export function formatLongDate(isoDate: string): string {
  return LONG_DAY.format(localDay(isoDate))
}

/** Una hora del día, para el mapa de calor: `13:00`. */
export function formatHourOfDay(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function minutesSince(iso: string, now: number): number {
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / MS_PER_MINUTE))
}

/** `3 min`, `1 h 05 min`. */
export function formatMinutes(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) {
    return `${String(minutes)} min`
  }
  const rest = String(minutes % MINUTES_PER_HOUR).padStart(2, '0')
  return `${String(Math.floor(minutes / MINUTES_PER_HOUR))} h ${rest} min`
}
