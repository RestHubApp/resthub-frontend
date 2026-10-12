import { useState } from 'react'

import { updateMenuItem } from '@/api/menu'
import type { DishCost, MenuItem, MenuSection } from '@/api/types'
import { DetailSheet } from '@/components/DetailSheet'
import { DishSheetContent, type DishSheetMode } from './DishSheetContent'
import { withItem } from './menuCache'
import type { Direction } from './menuOrder'
import { useMenuAction } from './useMenuAction'

interface DishSheetProps {
  readonly item: MenuItem
  readonly cost: DishCost | undefined
  readonly category: MenuSection
  readonly categories: readonly MenuSection[]
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/**
 * La ficha de un plato en una hoja: lo que no hace falta ver en cada fila de la carta.
 *
 * Editar y confirmar que sale de la carta cambian el contenido de la misma
 * hoja: nunca se abre una ventana encima de otra. Sacar un plato de la carta no
 * es «agotado hoy»: desaparece de la carta del mesero hasta que alguien lo
 * active, por eso se confirma.
 */
export function DishSheet({ item, cost, category, categories, isFirst, isLast, onMove, open, onOpenChange }: DishSheetProps) {
  const [mode, setMode] = useState<DishSheetMode>('record')
  const status = useMenuAction({
    send: () => updateMenuItem(item.id, { is_active: !item.is_active }),
    updateCache: withItem,
    failure: `No se pudo actualizar ${item.name}.`,
  })
  // Al cerrar, la hoja vuelve a su ficha para la próxima vez.
  const close = () => {
    setMode('record')
    onOpenChange(false)
  }

  return (
    <DetailSheet
      open={open}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          onOpenChange(true)
        } else {
          close()
        }
      }}
      title={mode === 'edit' ? `Editar ${item.name}` : item.name}
      description={`En ${category.name}`}
    >
      <DishSheetContent
        mode={mode}
        item={item}
        cost={cost}
        categories={categories}
        isFirst={isFirst}
        isLast={isLast}
        isPending={status.isPending}
        onMove={onMove}
        onMode={setMode}
        onToggleActive={() => {
          status.mutate()
        }}
        onDone={close}
      />
    </DetailSheet>
  )
}
