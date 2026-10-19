import type { BillingSettings } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { formatLongDate, wallClockIn } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { certificateState } from './invoicingReadiness'

interface CertificateStatusProps {
  readonly settings: BillingSettings
  readonly now: number
}

/** Si el certificado está cargado y hasta cuándo vale; avisa si vence en menos de 30 días o ya venció. */
export function CertificateStatus({ settings, now }: CertificateStatusProps) {
  const timeZone = useTimeZone()
  const state = certificateState(settings, now)
  const expires = settings.certificate_expires_at
  const day = expires === null ? '' : formatLongDate(wallClockIn(expires, timeZone).day)
  switch (state) {
    case 'missing': {
      return <FormMessage tone="info">Todavía no hay un certificado cargado.</FormMessage>
    }
    case 'expired': {
      return <FormMessage tone="error" role="status">El certificado venció el {day}. Sube uno vigente para seguir emitiendo.</FormMessage>
    }
    case 'expiring': {
      return <FormMessage tone="warning">El certificado vence el {day}. Renuévalo antes para no dejar de emitir.</FormMessage>
    }
    case 'valid': {
      return <FormMessage tone="ok">{day === '' ? 'Certificado cargado.' : `Certificado cargado. Vence el ${day}.`}</FormMessage>
    }
  }
}
