import type { OrderResponse } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { FormDialog } from '@/components/FormDialog'
import { formatMoney } from '@/services/format'
import { InvoiceDraftFields } from './InvoiceDraftFields'
import { useInvoiceForm } from './useInvoiceForm'

interface InvoiceDialogProps {
  readonly order: OrderResponse
  readonly open: boolean
  readonly onClose: () => void
}

/**
 * Emitir la boleta o la factura de un pedido pagado.
 *
 * La factura pide RUC y razón social; una boleta de hasta S/ 700 puede ir a
 * «clientes varios». El servidor valida lo mismo y lo envía al proveedor.
 */
export function InvoiceDialog({ order, open, onClose }: InvoiceDialogProps) {
  const form = useInvoiceForm(order, onClose)

  return (
    <FormDialog
      open={open}
      title={`Comprobante del pedido #${String(order.number)}`}
      description={`Total ${formatMoney(order.total)} (IGV incluido)`}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
    >
      <InvoiceDraftFields draft={form.draft} />
      <FormFooter
        mutation={form.mutation}
        failureText="No se pudo emitir el comprobante."
        onCancel={onClose}
        submit={{ label: `Emitir ${form.draft.kind}`, pendingLabel: 'Emitiendo…', onClick: form.issue, isDisabled: !form.canIssue }}
      />
    </FormDialog>
  )
}
