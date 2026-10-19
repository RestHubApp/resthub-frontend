import type { WasteApproval } from '@/api/types'
import { formatDateTime } from '@/services/format'

interface WasteDecisionNoteProps {
  readonly approval: WasteApproval
  readonly timeZone: string
}

/** Cuándo se decidió y, si se rechazó, por qué. Nada mientras espera. */
export function WasteDecisionNote({ approval, timeZone }: WasteDecisionNoteProps) {
  if (approval.decided_at === null) {
    return null
  }
  const when = formatDateTime(approval.decided_at, timeZone)
  if (approval.status === 'rejected') {
    return (
      <p className="m-0 text-sm">
        <span className="text-muted-foreground">Rechazada el {when}: </span>
        {approval.rejection_reason}
      </p>
    )
  }
  return <p className="m-0 text-sm text-muted-foreground">Aprobada el {when}: el stock bajó.</p>
}
