import { cashSessionsQuery, currentCashQuery } from '../../api/cash'
import { prefetch } from '../../services/queryClient'
import { can } from '../../store/session'

/** Caja: el turno en curso y la primera página de turnos anteriores. */
export function prefetchCash(): void {
  if (can('cash.manage')) {
    prefetch(currentCashQuery)
    prefetch(cashSessionsQuery(0))
  }
}
