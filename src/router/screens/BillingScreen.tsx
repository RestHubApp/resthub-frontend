import { BillingView } from '@/features/billing/BillingView'
import { InvoiceVoidSection } from '@/features/orders/invoice/InvoiceVoidSection'

/**
 * Comprobantes, con la anulación y el cambio de cada uno. Esa parte usa el
 * formulario de emisión de los pedidos; como una característica no importa a
 * otra, el router las junta.
 */
export function BillingScreen() {
  return <BillingView InvoiceSlot={InvoiceVoidSection} />
}
