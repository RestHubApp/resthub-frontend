import type { Invoice } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { FormFooter } from '@/components/FormFooter'
import { canVoidNow, invoiceName, voidExplanation, voidPath } from './invoiceVoid'
import { VoidSteps } from './VoidSteps'

/** `change`: anular y emitir otro (boleta ↔ factura, otro cliente). `void`: solo anular. */
export type InvoiceVoidMode = 'change' | 'void'

interface InvoiceVoidDialogProps {
  readonly invoice: Invoice
  readonly mode: InvoiceVoidMode
  readonly onClose: () => void
}

/**
 * Anular un comprobante emitido o cambiarlo por otro, en la misma ventana:
 * primero el motivo y, al cambiarlo, después los datos del nuevo. Nada se
 * envía hasta el último paso. Si el comprobante todavía no se puede anular
 * (pendiente, o con la nota en curso), la ventana solo explica qué hacer.
 */
export function InvoiceVoidDialog({ invoice, mode, onClose }: InvoiceVoidDialogProps) {
  const isChange = mode === 'change'
  const name = invoiceName(invoice)

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={isChange ? `Cambiar ${name}` : `Anular ${name}`}
      description={voidExplanation(invoice, isChange)}
    >
      {canVoidNow(voidPath(invoice)) ? (
        <VoidSteps invoice={invoice} isChange={isChange} onClose={onClose} />
      ) : (
        <FormFooter mutation={{ isPending: false }} onCancel={onClose} cancelLabel="Entendido" />
      )}
    </FormDialog>
  )
}
