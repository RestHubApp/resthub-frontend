import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { ShellIcon } from '@/features/shell/ShellIcon'
import type { NavEntry } from '@/features/shell/navigation'
import { MenuRowActions } from './MenuRowActions'

interface MenuRowProps {
  readonly entry: NavEntry
  readonly index: number
  readonly count: number
  readonly isInBar: boolean
  /** La barra de abajo ya tiene sus cuatro: esta, que no está en ella, no puede entrar. */
  readonly isBarFull: boolean
  readonly onStep: (index: number, step: -1 | 1) => void
  readonly onToggleBar: (path: string) => void
}

/**
 * Una pantalla del menú: un asa para arrastrarla, su icono y nombre, y un «⋯» con
 * Subir, Bajar y poner o sacar de la barra de abajo.
 *
 * El asa es lo único que arrastra (así el dedo puede desplazar la página sobre el
 * resto de la fila). El «⋯» es la alternativa de un solo toque, sin arrastrar, para
 * quien no puede o no quiere hacerlo (WCAG 2.5.7); con teclado, Espacio levanta el
 * asa, las flechas la mueven y Espacio la suelta.
 */
export function MenuRow({ entry, index, count, isInBar, isBarFull, onStep, onToggleBar }: MenuRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: entry.to })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-lg border bg-card py-1 pr-1 pl-1 ${isDragging ? 'relative z-10 shadow-float' : ''}`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        ref={setActivatorNodeRef}
        aria-label={`Arrastrar ${entry.label}`}
        className="touch-none cursor-grab text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <Icon name="dragHandle" size={18} />
      </Button>
      <span className="flex min-w-0 flex-1 items-center gap-3 font-medium">
        <ShellIcon name={entry.icon} size={18} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">{entry.label}</span>
      </span>
      <MenuRowActions
        entry={entry}
        index={index}
        count={count}
        isInBar={isInBar}
        isBarFull={isBarFull}
        onStep={onStep}
        onToggleBar={onToggleBar}
      />
    </li>
  )
}
