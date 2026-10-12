import { cn } from 'cn'
import { useState } from 'react'

import type { DishCost, MenuItem, MenuSection } from '@/api/types'
import { formatPercent } from '@/services/format'
import { AvailabilityToggle } from './AvailabilityToggle'
import { DishRowInfo } from './DishRowInfo'
import { DishSheet } from './DishSheet'
import type { Direction } from './menuOrder'

interface MenuItemRowProps {
  readonly item: MenuItem
  readonly cost: DishCost | undefined
  readonly category: MenuSection
  readonly categories: readonly MenuSection[]
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMove: (direction: Direction) => void
}

/**
 * Un plato en la carta, en una línea: nombre, precio y «Disponible hoy», que
 * es lo único que se toca a diario. Tocar el plato abre su ficha (descripción,
 * costo y margen, receta, editar, ordenar y sacarlo de la carta).
 *
 * El botón que abre la ficha cubre toda la fila; el interruptor queda encima
 * para seguir siendo tocable sin abrirla. En la laptop se suma el margen.
 */
export function MenuItemRow({ item, cost, category, categories, isFirst, isLast, onMove }: MenuItemRowProps) {
  const [isOpen, setIsOpen] = useState(false)
  const marginPercent = cost?.margin_percent ?? null

  return (
    <li
      className={cn(
        'relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:px-5',
        !item.is_active && 'bg-muted/60',
      )}
    >
      <button
        type="button"
        aria-label={`Ver la ficha de ${item.name}`}
        className="absolute inset-0 outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50"
        onClick={() => {
          setIsOpen(true)
        }}
      />
      <DishRowInfo item={item} />
      {marginPercent === null ? null : (
        <span className="hidden text-sm text-muted-foreground tabular-nums lg:block">Margen {formatPercent(marginPercent)}</span>
      )}
      {item.is_active ? (
        <div className="relative">
          <AvailabilityToggle item={item} />
        </div>
      ) : null}
      <DishSheet
        item={item}
        cost={cost}
        category={category}
        categories={categories}
        isFirst={isFirst}
        isLast={isLast}
        onMove={onMove}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </li>
  )
}
