import type { BillingSettings } from '@/api/types'

const DAY_MS = 86_400_000

/** Días antes del vencimiento desde los que se avisa que hay que renovar el certificado. */
const CERTIFICATE_WARNING_DAYS = 30

export type CertificateState = 'missing' | 'valid' | 'expiring' | 'expired'

/** Cómo está el certificado digital del local en el instante `now` (milisegundos). */
export function certificateState(settings: BillingSettings, now: number): CertificateState {
  if (!settings.has_certificate) return 'missing'
  if (settings.certificate_expires_at === null) return 'valid'
  const left = Date.parse(settings.certificate_expires_at) - now
  if (left <= 0) return 'expired'
  return left < CERTIFICATE_WARNING_DAYS * DAY_MS ? 'expiring' : 'valid'
}

/**
 * Lo que falta cargar, en el orden en que se llena la hoja. Solo explica: si el
 * local puede emitir lo dice `is_ready` del servidor (un certificado vencido lo
 * avisa `CertificateStatus`).
 */
export function missingForInvoicing(settings: BillingSettings): string[] {
  return [
    settings.ruc === '' ? 'el RUC' : '',
    settings.legal_name === '' ? 'la razón social' : '',
    settings.has_sol_credentials ? '' : 'el usuario y la clave SOL',
    settings.has_certificate ? '' : 'el certificado digital',
  ].filter((item) => item !== '')
}

/** «a», «a y b», «a, b y c». */
export function joinWithAnd(items: readonly string[]): string {
  const last = items.at(-1)
  if (items.length < 2 || last === undefined) return last ?? ''
  return `${items.slice(0, -1).join(', ')} y ${last}`
}
