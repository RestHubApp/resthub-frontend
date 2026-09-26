import { rolesQuery } from '../../api/roles'
import { prefetch } from '../../services/queryClient'
import { can } from '../../store/session'
import { STAFF_LIST_QUERY } from './staffList'

/** Personal: la lista de cuentas y los roles que se les pueden dar. */
export function prefetchStaff(): void {
  if (can('staff.manage')) {
    prefetch(STAFF_LIST_QUERY)
    prefetch(rolesQuery())
  }
}
