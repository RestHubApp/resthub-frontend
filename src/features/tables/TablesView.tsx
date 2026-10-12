import { useState } from 'react'

import type { TableState } from '@/api/types'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { TableFormDialog } from './TableFormDialog'
import { TableListCard } from './TableListCard'

/**
 * Las mesas del salon: crearlas, renombrarlas, ordenarlas y activarlas.
 *
 * El orden es el mismo en que el mesero ve la grilla, asi que conviene que
 * siga el recorrido del salon.
 */
export function TablesView() {
  // `undefined` cerrada; `null` para crear; una mesa para renombrarla.
  const [editing, setEditing] = useState<TableState | null | undefined>(undefined)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mesas"
        description="Las mesas del salón, en el orden en que las ve el mesero."
        actions={
          <Button type="button" onClick={() => {
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
      <TableListCard
        onRename={(table) => {
          setEditing(table)
        }}
      />
    </div>
  )
}
