// Formatos del panel: soles, porcentajes con un decimal y fechas en español
// del Perú. El servidor manda los montos como texto decimal para no perder
// centimos; aca se convierten solo para mostrarlos.

const LOCALE = 'es-PE'

const money = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'PEN' })
const compactMoney = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'PEN',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})
const twoDecimals = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 })

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0
  }
  const numero = typeof value === 'number' ? value : Number.parseFloat(value)
  return Number.isFinite(numero) ? numero : 0
}

/** `S/ 1,234.50`. */
export function formatMoney(value: string | number): string {
  return money.format(toNumber(value))
}

/** Para los ejes: `S/ 2.5 K`. */
export function formatMoneyCompact(value: number): string {
  return value < 1000 ? money.format(value).replace(/\.00$/u, '') : compactMoney.format(value)
}

export function formatInteger(value: string | number): string {
  return integer.format(toNumber(value))
}

/** `65.6 %`. */
export function formatPercent(value: string | number): string {
  return `${oneDecimal.format(toNumber(value))} %`
}

/** `+2.5 %` o `−0.9 %`, con el signo siempre escrito. */
export function formatChange(value: string | number): string {
  const numero = toNumber(value)
  const signos: Record<number, string> = { 1: '+', [-1]: '−' }
  return `${signos[Math.sign(numero)] ?? ''}${oneDecimal.format(Math.abs(numero))} %`
}

/** Una confianza de 0 a 1 como porcentaje entero: `87 %`. */
export function formatConfidence(value: number | null): string {
  return value === null ? 'Sin dato' : `${integer.format(value * 100)} %`
}

const UNIT_LABELS: Record<string, string> = { g: 'g', ml: 'ml', unit: 'unid.' }
const THOUSAND = 1000

/** Una cantidad de insumo legible: 1960 g pasa a `1.96 kg`, 5 unit a `5 unid.`. */
export function formatQuantity(value: string | number, unit: string): string {
  const numero = toNumber(value)
  if (unit === 'g' && Math.abs(numero) >= THOUSAND) {
    return `${twoDecimals.format(numero / THOUSAND)} kg`
  }
  if (unit === 'ml' && Math.abs(numero) >= THOUSAND) {
    return `${twoDecimals.format(numero / THOUSAND)} L`
  }
  return `${twoDecimals.format(numero)} ${UNIT_LABELS[unit] ?? unit}`
}

// Una fecha del local (`2026-09-18`) no tiene hora: se lee en UTC para que la
// zona del navegador no la corra al dia anterior.
function localDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`)
}

const shortDay = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longDay = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** `18 set.` */
export function formatShortDate(isoDate: string): string {
  return shortDay.format(localDay(isoDate))
}

/** `viernes, 18 de septiembre de 2026` */
export function formatLongDate(isoDate: string): string {
  return longDay.format(localDay(isoDate))
}

/** Un instante en la zona del restaurante: `25 set. 2026, 5:42 p. m.` */
export function formatDateTime(isoDateTime: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(isoDateTime))
}

/** `13:00` */
export function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

/** `0.7 días`, `1 día`. */
export function formatDays(value: string | number): string {
  const numero = toNumber(value)
  return `${twoDecimals.format(numero)} ${numero === 1 ? 'día' : 'días'}`
}
