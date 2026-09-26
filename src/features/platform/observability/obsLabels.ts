import type { ObsAccountKind, ObsLogLevel } from '../../../api/types'
import { formatClock, formatPercent, formatShortDateTime } from '../../../services/format'

const SECONDS_PER_HOUR = 3600
const MS_PER_SECOND = 1000
const PERCENT = 100

/**
 * Lo que dice el eje bajo un cubo: la hora sola mientras la ventana es de
 * horas; con cubos de horas (7 días) la hora sola se repetiría cada día, así
 * que lleva también el día.
 */
export function bucketAxisLabel(start: string, bucketSeconds: number, timeZone: string): string {
  return bucketSeconds >= SECONDS_PER_HOUR ? formatShortDateTime(start, timeZone) : formatClock(start, timeZone)
}

/** El cubo entero, para la lectura y la tabla: `25 set., 14:00 – 14:15`. */
export function bucketTitle(start: string, bucketSeconds: number, timeZone: string): string {
  const fin = new Date(new Date(start).getTime() + bucketSeconds * MS_PER_SECOND).toISOString()
  return `${formatShortDateTime(start, timeZone)} – ${formatClock(fin, timeZone)}`
}

/** La tasa de error del servidor (una fracción de 0 a 1) como porcentaje: `1.2 %`. */
export function formatErrorRate(rate: number): string {
  return formatPercent(rate * PERCENT)
}

const STATUS_CLASSES: Readonly<Record<number, string>> = {
  1: 'informativa',
  2: 'correcta',
  3: 'redirección',
  4: 'error del cliente',
  5: 'error del servidor',
}

/** `404 · error del cliente`: el código y qué clase de respuesta es. */
export function statusLabel(status: number): string {
  const clase = STATUS_CLASSES[Math.floor(status / PERCENT)] ?? 'otra'
  return `${String(status)} · ${clase}`
}

export const LEVEL_LABELS: Readonly<Record<ObsLogLevel, string>> = {
  warning: 'Advertencia',
  error: 'Error',
}

export const ACCOUNT_KIND_LABELS: Readonly<Record<ObsAccountKind, string>> = {
  staff: 'Personal',
  platform: 'Plataforma',
  preview: 'Vista previa',
  anonymous: 'Sin sesión',
}

/**
 * Los campos de un evento como texto con sangría, para un `<pre>`.
 *
 * Es texto y se muestra como texto: nunca como HTML, porque los valores
 * vienen de lo que alguien mandó al servidor. `null` si no hay campos.
 */
export function prettyFields(fields: Readonly<Record<string, unknown>>): string | null {
  return Object.keys(fields).length === 0 ? null : JSON.stringify(fields, null, 2)
}
