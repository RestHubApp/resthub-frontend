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

/** Lo que le falta al local para emitir, en el orden en que se llena la hoja. */
export function missingForInvoicing(settings: BillingSettings, now: number): string[] {
  const certificate = certificateState(settings, now)
  return [
    settings.ruc === '' ? 'el RUC' : '',
    settings.legal_name === '' ? 'la razón social' : '',
    settings.has_sol_credentials ? '' : 'el usuario y la clave SOL',
    certificate === 'missing' ? 'el certificado digital' : '',
    certificate === 'expired' ? 'un certificado digital vigente' : '',
  ].filter((item) => item !== '')
}

/** «a», «a y b», «a, b y c». */
export function joinWithAnd(items: readonly string[]): string {
  const last = items.at(-1)
  if (items.length < 2 || last === undefined) return last ?? ''
  return `${items.slice(0, -1).join(', ')} y ${last}`
}
