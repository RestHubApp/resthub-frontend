import type { UseQueryResult } from '@tanstack/react-query'

import type { WasteApproval, WasteApprovalPage, WasteApprovalStatus } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { WasteApprovalActions } from './WasteApprovalActions'
import { WasteApprovalCard } from './WasteApprovalCard'

interface WasteApprovalListProps {
  readonly query: UseQueryResult<WasteApprovalPage>
  readonly status: WasteApprovalStatus
  readonly canDecide: boolean
  readonly onReject: (approval: WasteApproval) => void
}

const EMPTY: Record<WasteApprovalStatus, string> = {
  pending_approval: 'No hay mermas esperando aprobación.',
  approved: 'Todavía no se aprobó ninguna merma.',
  rejected: 'Todavía no se rechazó ninguna merma.',
}

/** Las mermas del estado elegido, de la más nueva a la más vieja. */
export function WasteApprovalList({ query, status, canDecide, onReject }: WasteApprovalListProps) {
  if (query.isPending) {
    return <ListSkeleton label="Cargando las mermas…" count={3} itemClassName="h-40 rounded-xl" />
  }
  if (query.isError) {
    return <RetryQueryError error={query.error} fallback="No se pudieron cargar las mermas." onRetry={() => { void query.refetch() }} />
  }
  if (query.data.items.length === 0) {
    return <EmptyState title={EMPTY[status]} />
  }
  return (
    <ul aria-label="Mermas" className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
      {query.data.items.map((approval) => (
        <WasteApprovalCard
          key={approval.id}
          approval={approval}
          actions={approval.status === 'pending_approval' && canDecide ? <WasteApprovalActions approval={approval} onReject={onReject} /> : undefined}
        />
      ))}
    </ul>
  )
}
