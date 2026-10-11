import type { OrderResponse } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormDialog } from '@/components/FormDialog'
import { FormMessage } from '@/components/FormMessage'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { formatMoney } from '@/services/format'
import { CustomerFields } from './CustomerFields'
import { InvoiceDocumentSelect } from './InvoiceDocumentSelect'
import { InvoiceKindPicker } from './InvoiceKindPicker'
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
  const { kind, type, mutation } = form

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
      <InvoiceKindPicker kind={kind} onChange={form.setKind} />
      <InvoiceDocumentSelect kind={kind} totalCents={form.total} value={type} onChange={form.setDoc} />
      <CustomerFields
        documentType={type}
        withAddress={kind === 'factura'}
        values={form.customer}
        onChange={form.setCustomer}
      />
      {mutation.isError ? (
        <FormMessage tone="error">{errorMessage(mutation.error, 'No se pudo emitir el comprobante.')}</FormMessage>
      ) : null}
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" disabled={!form.canIssue} onClick={form.issue}>
          {mutation.isPending ? 'Emitiendo…' : `Emitir ${kind}`}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
