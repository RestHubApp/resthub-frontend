import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { reorderTables, tablesQuery } from '../../api/tables'
import type { TableState } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import ListSkeleton from '../../components/ListSkeleton'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import TableAdminRow from './TableAdminRow'
import { withOrder } from './tableCache'
import TableFormDialog from './TableFormDialog'
import { useTableMutation } from './useTableMutation'

/** El orden nuevo si se mueve una mesa un lugar hacia arriba o hacia abajo. */
function moved(tables: readonly TableState[], index: number, direction: -1 | 1): number[] {
  const ids = tables.map((table) => table.id)
  const destino = index + direction
  ;[ids[index], ids[destino]] = [ids[destino], ids[index]]
  return ids
}

/**
 * Las mesas del salon: crearlas, renombrarlas, ordenarlas y activarlas.
 *
 * El orden es el mismo en que el mesero ve la grilla, asi que conviene que
 * siga el recorrido del salon.
 */
export default function TablesView() {
  const mesas = useQuery(tablesQuery(true))
  // `undefined` cerrada; `null` para crear; una mesa para renombrarla.
  const [editando, setEditando] = useState<TableState | null | undefined>(undefined)
  const orden = useTableMutation({
    mutationFn: reorderTables,
    failure: 'No se pudo cambiar el orden.',
    updateCache: withOrder,
  })
  const lista = mesas.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mesas"
        description="Las mesas del salón, en el orden en que las ve el mesero."
        actions={
          <Button type="button" size="lg" className="h-11 px-4" onClick={() => {
            setEditando(null)
          }}>
            <Icon name="agregar" size={16} />
            <span>Nueva mesa</span>
          </Button>
        }
      />
      <TableFormDialog
        table={editando ?? null}
        open={editando !== undefined}
        onOpenChange={(abierto) => {
          if (!abierto) {
            setEditando(undefined)
          }
        }}
      />
      <SectionCard title="Salón" description={mesas.isSuccess ? `${String(lista.filter((mesa) => mesa.is_active).length)} activas de ${String(lista.length)}` : undefined}>
        {mesas.isPending ? <ListSkeleton label="Cargando mesas…" count={5} itemClassName="h-14 rounded-lg" /> : null}
        {mesas.isError ? <FormMessage tone="error">{errorMessage(mesas.error, 'No se pudieron cargar las mesas.')}</FormMessage> : null}
        {mesas.isSuccess && lista.length === 0 ? (
          <EmptyState title="Todavía no hay mesas" description="Crea la primera con «Nueva mesa»." />
        ) : null}
        <ul className="m-0 flex list-none flex-col p-0">
          {lista.map((mesa, index) => (
            <TableAdminRow
              key={mesa.id}
              table={mesa}
              isFirst={index === 0}
              isLast={index === lista.length - 1}
              moving={orden.isPending}
              onMove={(direccion) => {
                orden.mutate(moved(lista, index, direccion))
              }}
              onRename={() => {
                setEditando(mesa)
              }}
            />
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}
