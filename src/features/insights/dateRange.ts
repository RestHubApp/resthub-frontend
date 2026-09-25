// Rangos del panel. Los dias son del restaurante, no del navegador: a las
// 11 p. m. en Lima ya es mañana en UTC, y "hoy" tiene que seguir siendo hoy.

/** Un rango del panel, con ambos días incluidos. */
export interface RangeDates {
  readonly date_from: string
  readonly date_to: string
}

export type RangePreset = 'hoy' | '7d' | '30d' | 'mes' | 'personalizado'

export const RANGE_PRESETS: readonly { readonly value: RangePreset; readonly label: string }[] = [
  { value: 'hoy', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'mes', label: 'Este mes' },
  { value: 'personalizado', label: 'Personalizado' },
]

export const DEFAULT_PRESET: RangePreset = '30d'

/** El tope de dias que acepta el servidor en un reporte. */
export const MAX_RANGE_DAYS = 366

const DAY_MS = 86_400_000

export function isRangePreset(value: string | null): value is RangePreset {
  return RANGE_PRESETS.some((preset) => preset.value === value)
}

export function addDays(isoDate: string, days: number): string {
  const fecha = new Date(`${isoDate}T00:00:00Z`)
  return new Date(fecha.getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

/** Dias entre dos fechas, contando ambas. */
export function daysBetween(from: string, to: string): number {
  const desde = new Date(`${from}T00:00:00Z`).getTime()
  const hasta = new Date(`${to}T00:00:00Z`).getTime()
  return Math.round((hasta - desde) / DAY_MS) + 1
}

/** Las fechas de un rango predefinido, terminando hoy. */
export function presetRange(
  preset: Exclude<RangePreset, 'personalizado'>,
  today: string,
): RangeDates {
  const inicio: Record<typeof preset, string> = {
    hoy: today,
    '7d': addDays(today, -6),
    '30d': addDays(today, -29),
    mes: `${today.slice(0, 8)}01`,
  }
  return { date_from: inicio[preset], date_to: today }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u

/** Por qué un rango personalizado no sirve, o `null` si sirve. */
export function customRangeProblem(from: string, to: string): string | null {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    return 'Elige las dos fechas.'
  }
  if (from > to) {
    return 'La fecha de inicio tiene que ser anterior a la de fin.'
  }
  if (daysBetween(from, to) > MAX_RANGE_DAYS) {
    return `El rango puede tener hasta ${String(MAX_RANGE_DAYS)} días.`
  }
  return null
}
