import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { PERMISSION } from '@/api/permissions'
import type { WasteApproval, WasteApprovalStatus } from '@/api/types'
import { wasteApprovalsQuery } from '@/api/wasteApprovals'
import { PageHeader } from '@/components/PageHeader'
import { SegmentedChoice } from '@/components/SegmentedChoice'
import { useCan } from '@/store/session'
import { RejectWasteDialog } from './RejectWasteDialog'
import { WasteApprovalList } from './WasteApprovalList'

const STATUSES: readonly { readonly value: WasteApprovalStatus; readonly label: string }[] = [
  { value: 'pending_approval', label: 'Por aprobar' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
]

/**
 * La bandeja de las mermas que superan el monto del local. Mientras esperan,
 * el stock no se mueve: aprobada, baja en ese momento; rechazada, queda igual.
 */
export function WasteApprovalsView() {
  const canDecide = useCan(PERMISSION.inventoryApproveWaste)
  const [status, setStatus] = useState<WasteApprovalStatus>('pending_approval')
  const [rejecting, setRejecting] = useState<WasteApproval | null>(null)
  const approvals = useQuery(wasteApprovalsQuery(status))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mermas por aprobar"
        description="Las mermas que pasan del monto del local esperan tu visto bueno. El stock no cambia hasta que las apruebes."
      />
      <SegmentedChoice legend="Qué mermas ver" name="estado-merma" options={STATUSES} value={status} onChange={setStatus} />
      <WasteApprovalList query={approvals} status={status} canDecide={canDecide} onReject={setRejecting} />
      <RejectWasteDialog
        approval={rejecting}
        onClose={() => {
          setRejecting(null)
        }}
      />
    </div>
  )
}
