import type { DishCost, MenuItem, MenuSection } from '@/api/types'
import { DishSheetBody } from './DishSheetBody'
import { DishSheetDeactivate } from './DishSheetDeactivate'
import type { Direction } from './menuOrder'
import { MenuItemForm } from './MenuItemForm'

/** Qué muestra la hoja del plato: su ficha, el formulario de edición o la confirmación de sacarlo. */
export type DishSheetMode = 'record' | 'edit' | 'deactivate'

interface DishSheetContentProps {
  readonly mode: DishSheetMode
  readonly item: MenuItem
  readonly cost: DishCost | undefined
  readonly categories: readonly MenuSection[]
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly isPending: boolean
  readonly onMove: (direction: Direction) => void
  readonly onMode: (mode: DishSheetMode) => void
  readonly onToggleActive: () => void
  /** Cierra la hoja (al guardar o al confirmar). */
  readonly onDone: () => void
}

/** El contenido de la hoja de un plato según lo que se esté haciendo con él. */
export function DishSheetContent({
  mode,
  item,
  cost,
  categories,
  isFirst,
  isLast,
  isPending,
  onMove,
  onMode,
  onToggleActive,
  onDone,
}: DishSheetContentProps) {
  if (mode === 'edit') {
    return <MenuItemForm item={item} categories={categories} onDone={onDone} />
  }
  if (mode === 'deactivate') {
    return (
      <DishSheetDeactivate
        item={item}
        isPending={isPending}
        onBack={() => {
          onMode('record')
        }}
        onConfirm={() => {
          onToggleActive()
          onDone()
        }}
      />
    )
  }

  return (
    <DishSheetBody
      item={item}
      cost={cost}
      isFirst={isFirst}
      isLast={isLast}
      isPending={isPending}
      onMove={onMove}
      onEdit={() => { onMode('edit') }}
      onDeactivate={() => { onMode('deactivate') }}
      onActivate={() => { onToggleActive(); onDone() }}
    />
  )
}
