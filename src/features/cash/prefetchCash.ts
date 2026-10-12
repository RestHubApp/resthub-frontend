import { cashSessionsQuery, currentCashQuery } from '@/api/cash'
import { PERMISSION } from '@/api/permissions'
import { prefetch } from '@/services/queryClient'
import { can } from '@/store/session'

/** Caja: el turno en curso y la primera página de turnos anteriores. */
export function prefetchCash(): void {
  if (can(PERMISSION.cashManage)) {
    prefetch(currentCashQuery)
    prefetch(cashSessionsQuery(0))
  }
}
