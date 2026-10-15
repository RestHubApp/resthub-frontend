import type { BillingSettings } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { joinWithAnd, missingForInvoicing } from './invoicingReadiness'

/** Si el local ya puede emitir comprobantes (`is_ready`) y, si no, qué le falta. */
export function BillingReadiness({ settings }: { readonly settings: BillingSettings }) {
  if (settings.is_ready) {
    return <FormMessage tone="ok" icon="ready">Listo para emitir: los comprobantes se envían a SUNAT al emitirlos.</FormMessage>
  }
  const missing = missingForInvoicing(settings)
  const detail = missing.length === 0 ? 'Revisa el vencimiento del certificado.' : `Falta ${joinWithAnd(missing)}.`
  return (
    <FormMessage tone="warning" icon="notice">
      Todavía no se puede emitir. {detail} Mientras tanto, los comprobantes se guardan sin enviar a SUNAT y se reenvían después.
    </FormMessage>
  )
}
