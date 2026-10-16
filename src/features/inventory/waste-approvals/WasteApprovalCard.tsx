import type { ReactNode } from 'react'

import type { WasteApproval } from '@/api/types'
import { StatusBadge, type StatusTone } from '@/components/StatusBadge'
import { formatDateTime, formatMoney, formatQuantity } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { WasteDecisionNote } from './WasteDecisionNote'

const TONES: Record<WasteApproval['status'], StatusTone> = {
  pending_approval: 'pending',
  approved: 'completed',
  rejected: 'cancelled',
}

interface WasteApprovalCardProps {
  readonly approval: WasteApproval
  /** Aprobar y rechazar, si la merma espera y la cuenta puede decidir. */
  readonly actions?: ReactNode
}

/** Una merma grande: qué, cuánto, cuánto vale, por qué y en qué quedó. */
export function WasteApprovalCard({ approval, actions }: WasteApprovalCardProps) {
  const timeZone = useTimeZone()
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h3 className="m-0 text-base font-semibold">{approval.ingredient_name}</h3>
          <p className="m-0 text-sm text-muted-foreground">Registrada el {formatDateTime(approval.created_at, timeZone)}</p>
        </div>
        <StatusBadge label={approval.status_label} tone={TONES[approval.status]} />
      </div>
      <dl className="m-0 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Cantidad</dt>
          <dd className="m-0 font-medium tabular-nums">{formatQuantity(approval.quantity, approval.unit ?? 'unit')}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Valor</dt>
          <dd className="m-0 font-semibold tabular-nums">{formatMoney(approval.value)}</dd>
        </div>
      </dl>
      <p className="m-0 text-sm">
        <span className="text-muted-foreground">Motivo: </span>
        {approval.reason}
      </p>
      <WasteDecisionNote approval={approval} timeZone={timeZone} />
      {actions}
    </li>
  )
}
