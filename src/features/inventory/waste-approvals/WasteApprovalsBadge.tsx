import { useQuery } from '@tanstack/react-query'

import { wasteApprovalsQuery } from '@/api/wasteApprovals'

// Cada cuánto se vuelve a preguntar: una merma grande no es una urgencia de
// segundos, pero no debería esperar a que alguien abra la bandeja.
const REFRESH_MS = 60_000

/**
 * Cuántas mermas esperan aprobación, junto a la entrada del menú. Sin
 * pendientes (o si la consulta falla) no muestra nada: el menú no se llena de
 * ceros ni de errores.
 */
export function WasteApprovalsBadge() {
  const pending = useQuery({ ...wasteApprovalsQuery('pending_approval'), refetchInterval: REFRESH_MS })
  const total = pending.data?.total ?? 0
  if (total === 0) {
    return null
  }
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-xs leading-5 font-semibold text-background tabular-nums">
      {total}
      <span className="sr-only"> por aprobar</span>
    </span>
  )
}
