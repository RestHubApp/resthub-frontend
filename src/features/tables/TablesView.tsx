import { useState } from 'react'

import type { TableState } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useScreenAction } from '@/hooks/useScreenAction'
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

  const request = useScreenAction('nueva-mesa')
  // Lo pedido por la dirección abre «Nueva mesa» salvo que ya haya otra ventana abierta.
  const current = editing === undefined && request.isRequested ? null : editing

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mesas"
        description="Las mesas del salón, en el orden en que las ve el mesero."
        actions={
          <Button type="button" onClick={() => {
            setEditing(null)
          }}>
            <Icon glyph={icons.add} size={16} />
            <span>Nueva mesa</span>
          </Button>
        }
      />
      <TableFormDialog
        table={current ?? null}
        open={current !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(undefined)
            request.clear()
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
