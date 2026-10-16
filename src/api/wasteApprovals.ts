import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import { inventoryQueryKey } from './inventory'
import type { WasteApproval, WasteApprovalPage, WasteApprovalStatus } from './types'

// Las mermas cuyo valor supera el monto del local: esperan que el encargado
// las apruebe (recién ahí se descuenta el stock) o las rechace con un motivo.

export const wasteApprovalsQueryKey = [...inventoryQueryKey, 'waste-approvals'] as const

/** Una página de la bandeja basta: se aprueban casi en el día. */
const PAGE_SIZE = 100

async function fetchWasteApprovals(status: WasteApprovalStatus): Promise<WasteApprovalPage> {
  return send((client) =>
    client.GET('/api/v1/inventory/waste-approvals', { params: { query: { status, limit: PAGE_SIZE } } }),
  )
}

/** Las mermas en un estado, de la más nueva a la más vieja. */
export function wasteApprovalsQuery(status: WasteApprovalStatus) {
  return queryOptions({
    queryKey: [...wasteApprovalsQueryKey, status] as const,
    queryFn: () => fetchWasteApprovals(status),
  })
}

export async function approveWaste(approvalId: number): Promise<WasteApproval> {
  return send((client) =>
    client.POST('/api/v1/inventory/waste-approvals/{approval_id}/approve', {
      params: { path: { approval_id: approvalId } },
    }),
  )
}

export async function rejectWaste(approvalId: number, reason: string): Promise<WasteApproval> {
  return send((client) =>
    client.POST('/api/v1/inventory/waste-approvals/{approval_id}/reject', {
      params: { path: { approval_id: approvalId } },
      body: { reason },
    }),
  )
}
