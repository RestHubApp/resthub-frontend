import { inventoryQueryKey } from '@/api/inventory'
import type { WasteApproval } from '@/api/types'
import { wasteApprovalsQueryKey } from '@/api/wasteApprovals'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

interface WasteDecision<TVars> {
  readonly send: (vars: TVars) => Promise<WasteApproval>
  readonly success: (decided: WasteApproval) => string
  readonly onSuccess?: () => void
}

/**
 * Aprobar o rechazar una merma. Aprobada, el stock baja en ese momento, así
 * que el inventario entero se relee de fondo (la bandeja está adentro). Si
 * otra persona ya la decidió, la bandeja se relee para no ofrecerla de nuevo.
 */
export function useWasteDecision<TVars>({ send, success, onSuccess }: WasteDecision<TVars>) {
  return useNotifiedMutation({
    mutationFn: send,
    success,
    invalidate: [inventoryQueryKey],
    invalidateOnError: [wasteApprovalsQueryKey],
    ...(onSuccess === undefined ? {} : { onSuccess }),
  })
}
