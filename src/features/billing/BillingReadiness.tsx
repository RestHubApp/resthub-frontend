import type { BillingSettings } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { joinWithAnd, missingForInvoicing } from './invoicingReadiness'

interface BillingReadinessProps {
  readonly settings: BillingSettings
  readonly now: number
}

/** Si el local ya puede emitir comprobantes y, si no, qué le falta. */
export function BillingReadiness({ settings, now }: BillingReadinessProps) {
  const missing = missingForInvoicing(settings, now)
  if (settings.is_ready && missing.length === 0) {
    return <FormMessage tone="ok" icon="ready">Listo para emitir: los comprobantes se envían a SUNAT al emitirlos.</FormMessage>
  }
  const detail = missing.length === 0 ? 'Revisa los datos fiscales.' : `Falta ${joinWithAnd(missing)}.`
  return (
    <FormMessage tone="warning" icon="notice">
      Todavía no se puede emitir. {detail} Mientras tanto, los comprobantes se guardan sin enviar a SUNAT y se reenvían después.
    </FormMessage>
  )
}
