import { downloadCreditNoteDocument } from '@/api/billing'
import { PERMISSION } from '@/api/permissions'
import type { CreditNote } from '@/api/types'
import { InvoiceDownloads } from '@/components/InvoiceDownloads'
import { Button } from '@/components/ui/button'
import { useCan } from '@/store/session'
import { useResendCreditNote } from './useResendCreditNote'

interface CreditNoteStatusProps {
  readonly note: CreditNote
  /** Si el comprobante ya quedó anulado; si no, la anulación sigue en curso. */
  readonly isVoided: boolean
}

/**
 * La nota de crédito que anula el comprobante: su número, cómo la recibió
 * SUNAT, sus archivos y, mientras no la acepte, «Reenviar nota».
 */
export function CreditNoteStatus({ note, isVoided }: CreditNoteStatusProps) {
  const canManage = useCan(PERMISSION.billingManage)
  const resend = useResendCreditNote()

  return (
    <div className="flex basis-full flex-wrap items-center gap-2 text-xs">
      <span>
        {isVoided ? '' : 'Anulación en curso · '}Nota de crédito {note.code} · {note.status_label}
      </span>
      {note.status === 'rejected' && note.provider_message !== '' ? (
        <span className="basis-full text-destructive">{note.provider_message}</span>
      ) : null}
      <InvoiceDownloads invoice={note} fetchFile={downloadCreditNoteDocument} of={`de la nota ${note.code}`} />
      {canManage && note.status !== 'accepted' ? (
        <Button type="button" size="sm" variant="outline" disabled={resend.isPending} onClick={() => {
          resend.mutate(note.id)
        }}>
          {resend.isPending ? 'Reenviando…' : 'Reenviar nota'}
        </Button>
      ) : null}
    </div>
  )
}
