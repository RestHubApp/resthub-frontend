import { PERMISSION } from '@/api/permissions'
import { tablesQuery } from '@/api/tables'
import { prefetch } from '@/services/queryClient'
import { can } from '@/store/session'

/** Mesas: todas, también las desactivadas. */
export function prefetchTables(): void {
  if (can(PERMISSION.tablesManage)) {
    prefetch(tablesQuery(true))
  }
}
