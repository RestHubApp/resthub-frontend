import { useQuery } from '@tanstack/react-query'

import { lookupStatusQuery } from '@/api/lookup'
import { PERMISSION } from '@/api/permissions'
import { useCan } from '@/store/session'

/** Si se ofrece buscar RUC y DNI: la cuenta puede emitir comprobantes o gestionar clientes y el servidor tiene la búsqueda encendida. */
export function useLookupEnabled(): boolean {
  const canIssue = useCan(PERMISSION.billingIssue)
  const canManage = useCan(PERMISSION.customersManage)
  const status = useQuery({ ...lookupStatusQuery, enabled: canIssue || canManage })
  return status.data?.enabled === true
}
