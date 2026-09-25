import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'

import { fetchTables, tableName, tablesListQueryKey } from '../../../api/tables'
import EmptyState from '../../../components/EmptyState'
import { Button } from '../../../components/ui/button'
import OccupiedNotice from './OccupiedNotice'
import TakeOrder from './TakeOrder'

interface NewTableOrderProps {
  readonly tableId: number
}

/** Un pedido nuevo en una mesa. El nombre de la mesa sale del estado del salon. */
export default function NewTableOrder({ tableId }: NewTableOrderProps) {
  const mesas = useQuery({ queryKey: tablesListQueryKey(false), queryFn: () => fetchTables() })
  const mesa = mesas.data?.find((item) => item.id === tableId)

  if (mesas.isSuccess && mesa === undefined) {
    return (
      <EmptyState title="Esa mesa no existe o está desactivada">
        <Button asChild variant="outline" size="lg" className="h-11 px-4">
          <Link to="/pedidos">Volver a las mesas</Link>
        </Button>
      </EmptyState>
    )
  }
  const ocupada = mesa?.active_order ?? null

  return (
    <TakeOrder
      target={{ kind: 'table', tableId }}
      title={mesa === undefined ? 'Mesa' : tableName(mesa.label)}
      description="Nuevo pedido. Toca los platos que pide la mesa."
      notice={ocupada === null ? undefined : <OccupiedNotice orderId={ocupada.id} number={ocupada.number} />}
    />
  )
}
