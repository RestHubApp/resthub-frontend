import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router'

import { PERMISSION } from '@/api/permissions'
import { stockCountQuery } from '@/api/stockCounts'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { useCan } from '@/store/session'
import { CountBody } from './CountBody'
import { CountHeader } from './CountHeader'

/**
 * Un conteo físico en su propia dirección: mientras está en curso es la lista
 * para contar; cerrado, su reporte de diferencias.
 */
export function StockCountView() {
  const countId = Number(useParams()['countId'])
  const canManage = useCan(PERMISSION.inventoryManage)
  const count = useQuery(stockCountQuery(countId))

  return (
    <div className="flex flex-col gap-6">
      <CountHeader count={count.data} canManage={canManage} />
      {count.isPending ? <ListSkeleton label="Cargando el conteo…" count={4} itemClassName="h-28 rounded-xl" /> : null}
      {count.isError ? (
        <RetryQueryError
          error={count.error}
          fallback="No se pudo cargar el conteo."
          onRetry={() => {
            void count.refetch()
          }}
        />
      ) : null}
      {count.data === undefined ? null : <CountBody count={count.data} canManage={canManage} />}
    </div>
  )
}
