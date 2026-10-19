import type { Invoice, IssueInvoiceRequest } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { InvoiceDraftFields } from './InvoiceDraftFields'
import { useInvoiceDraft } from './useInvoiceDraft'

interface ReissueStepProps {
  readonly invoice: Invoice
  readonly isPending: boolean
  /** Ya quedó anulado en un intento anterior: solo falta emitir. */
  readonly isVoided: boolean
  readonly onBack: () => void
  readonly onIssue: (request: IssueInvoiceRequest) => void
  readonly children?: React.ReactNode
}

/**
 * Los datos del comprobante nuevo, con el mismo formulario de la emisión. Por
 * omisión propone el otro tipo: lo común es que pidan factura en vez de boleta.
 */
export function ReissueStep({ invoice, isPending, isVoided, onBack, onIssue, children }: ReissueStepProps) {
  const draft = useInvoiceDraft(invoice.total, invoice.kind === 'boleta' ? 'factura' : 'boleta')

  return (
    <>
      <p className="m-0 text-sm font-medium">Datos del nuevo comprobante</p>
      <InvoiceDraftFields draft={draft} />
      {children}
      <FormFooter
        mutation={{ isPending }}
        onCancel={onBack}
        cancelLabel="Volver"
        submit={{
          label: isVoided ? `Emitir ${draft.kind}` : `Anular y emitir ${draft.kind}`,
          pendingLabel: isVoided ? 'Emitiendo…' : 'Anulando y emitiendo…',
          isDisabled: !draft.isComplete,
          onClick: () => {
            onIssue(draft.request(invoice.order_id))
          },
        }}
      />
    </>
  )
}
