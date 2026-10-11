import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { tableName, tablesQuery } from '@/api/tables'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { OccupiedNotice } from './OccupiedNotice'
import { TakeOrder } from './TakeOrder'

interface NewTableOrderProps {
  readonly tableId: number
}

/** Un pedido nuevo en una mesa. El nombre de la mesa sale del estado del salon. */
export function NewTableOrder({ tableId }: NewTableOrderProps) {
  const tables = useQuery(tablesQuery(false))
  const table = tables.data?.find((item) => item.id === tableId)

  if (tables.isSuccess && table === undefined) {
    return (
      <EmptyState title="Esa mesa no existe o está desactivada">
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link to={paths.orders.list}>Volver a las mesas</Link>
        </Button>
      </EmptyState>
    )
  }
  const occupied = table?.active_order ?? null

  return (
    <TakeOrder
      target={{ kind: 'table', tableId }}
      title={table === undefined ? 'Mesa' : tableName(table.label)}
      description="Nuevo pedido. Toca los platos que pide la mesa."
      notice={occupied === null ? undefined : <OccupiedNotice orderId={occupied.id} number={occupied.number} />}
    />
  )
}
