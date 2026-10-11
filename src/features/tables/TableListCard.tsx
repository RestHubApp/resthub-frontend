import { useQuery } from '@tanstack/react-query'

import { reorderTables, tablesQuery } from '@/api/tables'
import type { TableState } from '@/api/types'
import { SectionCard } from '@/components/SectionCard'
import { TableAdminRow } from './TableAdminRow'
import { withOrder } from './tableCache'
import { TableListStatus } from './TableListStatus'
import { useTableMutation } from './useTableMutation'

/** El orden nuevo si se mueve una mesa un lugar hacia arriba o hacia abajo. */
function moved(tables: readonly TableState[], index: number, direction: -1 | 1): number[] {
  const ids = tables.map((table) => table.id)
  const destination = index + direction
  const actual = ids[index]
  const neighbor = ids[destination]
  if (actual === undefined || neighbor === undefined) {
    return ids
  }
  ids[index] = neighbor
  ids[destination] = actual
  return ids
}

interface TableListCardProps {
  readonly onRename: (table: TableState) => void
}

/** La tarjeta «Salón»: las mesas en su orden, con cómo subirlas, bajarlas y renombrarlas. */
export function TableListCard({ onRename }: TableListCardProps) {
  const tables = useQuery(tablesQuery(true))
  const order = useTableMutation({
    mutationFn: reorderTables,
    failure: 'No se pudo cambiar el orden.',
    updateCache: withOrder,
  })
  const list = tables.data ?? []
  const activeCount = list.filter((table) => table.is_active).length

  return (
    <SectionCard title="Salón" description={tables.isSuccess ? `${String(activeCount)} activas de ${String(list.length)}` : undefined}>
      <TableListStatus
        isPending={tables.isPending}
        isError={tables.isError}
        isEmpty={tables.isSuccess && list.length === 0}
        error={tables.error}
        onRetry={() => {
          void tables.refetch()
        }}
      />
      <ul className="m-0 flex list-none flex-col p-0">
        {list.map((table, index) => (
          <TableAdminRow
            key={table.id}
            table={table}
            isFirst={index === 0}
            isLast={index === list.length - 1}
            moving={order.isPending}
            onMove={(address) => {
              order.mutate(moved(list, index, address))
            }}
            onRename={() => {
              onRename(table)
            }}
          />
        ))}
      </ul>
    </SectionCard>
  )
}
