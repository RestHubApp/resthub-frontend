import type { Invoice } from '@/api/types'
import { InvoiceVoidActions } from './InvoiceVoidActions'
import { InvoiceVoidState } from './InvoiceVoidState'

/**
 * La anulación de un comprobante en el listado de facturación: cómo quedó
 * (motivo, nota de crédito, a cuál reemplaza) y «Cambiar» o «Anular». El
 * router la entrega a la pantalla de comprobantes, que no conoce los pedidos.
 */
export function InvoiceVoidSection({ invoice }: { readonly invoice: Invoice }) {
  return (
    <div className="flex basis-full flex-wrap items-center gap-2 empty:hidden">
      <InvoiceVoidState invoice={invoice} />
      <InvoiceVoidActions invoice={invoice} />
    </div>
  )
}
