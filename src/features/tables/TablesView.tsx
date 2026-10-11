import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { reorderTables, tablesQuery } from '@/api/tables'
import type { TableState } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { ListSkeleton } from '@/components/ListSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { TableAdminRow } from './TableAdminRow'
import { withOrder } from './tableCache'
import { TableFormDialog } from './TableFormDialog'
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

/**
 * Las mesas del salon: crearlas, renombrarlas, ordenarlas y activarlas.
 *
 * El orden es el mismo en que el mesero ve la grilla, asi que conviene que
 * siga el recorrido del salon.
 */
export function TablesView() {
  const tables = useQuery(tablesQuery(true))
  // `undefined` cerrada; `null` para crear; una mesa para renombrarla.
  const [editing, setEditing] = useState<TableState | null | undefined>(undefined)
  const order = useTableMutation({
    mutationFn: reorderTables,
    failure: 'No se pudo cambiar el orden.',
    updateCache: withOrder,
  })
  const list = tables.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mesas"
        description="Las mesas del salón, en el orden en que las ve el mesero."
        actions={
          <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
            setEditing(null)
          }}>
            <Icon name="add" size={16} />
            <span>Nueva mesa</span>
          </Button>
        }
      />
      <TableFormDialog
        table={editing ?? null}
        open={editing !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(undefined)
          }
        }}
      />
      <SectionCard title="Salón" description={tables.isSuccess ? `${String(list.filter((table) => table.is_active).length)} activas de ${String(list.length)}` : undefined}>
        {tables.isPending ? <ListSkeleton label="Cargando mesas…" count={5} itemClassName="h-14 rounded-lg" /> : null}
        {tables.isError ? <RetryQueryError message={errorMessage(tables.error, 'No se pudieron cargar las mesas.')} onRetry={() => { void tables.refetch() }} /> : null}
        {tables.isSuccess && list.length === 0 ? (
          <EmptyState title="Todavía no hay mesas" description="Crea la primera con «Nueva mesa»." />
        ) : null}
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
                setEditing(table)
              }}
            />
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
