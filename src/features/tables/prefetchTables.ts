import { tablesQuery } from '../../api/tables'
import { prefetch } from '../../services/queryClient'
import { can } from '../../store/session'

/** Mesas: todas, también las desactivadas. */
export function prefetchTables(): void {
  if (can('tables.manage')) {
    prefetch(tablesQuery(true))
  }
}
