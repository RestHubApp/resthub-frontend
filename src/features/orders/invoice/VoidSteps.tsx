import { useState } from 'react'

import type { Invoice } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { billingErrorMessage } from '@/services/billingErrors'
import * as icons from '@/components/icons'
import { capitalize, invoiceName } from './invoiceVoid'
import { ReissueStep } from './ReissueStep'
import { useVoidInvoice } from './useVoidInvoice'
import { VoidReasonStep } from './VoidReasonStep'

const VOID_SUBMIT = { label: 'Anular comprobante', pendingLabel: 'Anulando…', icon: icons.cancel, variant: 'destructive' } as const

interface VoidStepsProps {
  readonly invoice: Invoice
  readonly isChange: boolean
  readonly onClose: () => void
}

/** El motivo y, al cambiar el comprobante, los datos del nuevo; anula (y emite) en el último paso. */
export function VoidSteps({ invoice, isChange, onClose }: VoidStepsProps) {
  const [reason, setReason] = useState<string | null>(null)
  const { mutation, voided } = useVoidInvoice(invoice, onClose)
  const failure = mutation.isError ? (
    <FormMessage tone="error">{failureText(mutation.error, voided === null ? null : invoiceName(invoice))}</FormMessage>
  ) : null

  if (isChange && reason !== null) {
    return (
      <ReissueStep invoice={invoice} isPending={mutation.isPending} isVoided={voided !== null} onBack={() => {
        setReason(null)
      }} onIssue={(reissue) => {
        mutation.mutate({ reason, reissue })
      }}>
        {failure}
      </ReissueStep>
    )
  }
  return (
    <VoidReasonStep
      reason={reason ?? ''}
      isPending={mutation.isPending}
      submit={isChange ? { label: 'Siguiente' } : VOID_SUBMIT}
      onCancel={onClose}
      onReason={(written) => {
        if (isChange) setReason(written)
        else mutation.mutate({ reason: written, reissue: null })
      }}
    >
      {failure}
    </VoidReasonStep>
  )
}

/** Si ya quedó anulado y lo que falló fue la emisión del nuevo, lo dice: el reintento solo emite. */
function failureText(error: unknown, voidedName: string | null): string {
  const message = billingErrorMessage(error, 'No se pudo completar. Vuelve a intentarlo.')
  return voidedName === null ? message : `${capitalize(voidedName)} ya quedó anulada, pero no se pudo emitir el nuevo: ${message}`
}
