import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { NavEntry } from '@/features/shell/navigation'
import { menuActionsId } from './menuActionsId'

interface MenuRowActionsProps {
  readonly entry: NavEntry
  readonly index: number
  readonly count: number
  readonly isInBar: boolean
  readonly isBarFull: boolean
  readonly onStep: (index: number, step: -1 | 1) => void
  readonly onToggleBar: (path: string) => void
}

/** El «⋯» de una pantalla del menú: Subir, Bajar y poner o sacar de la barra de abajo (la barra admite cuatro). */
export function MenuRowActions({ entry, index, count, isInBar, isBarFull, onStep, onToggleBar }: MenuRowActionsProps) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" id={menuActionsId(entry.to)} aria-label={`Acciones de ${entry.label}`}>
          <Icon name="more" size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={index === 0}
          onSelect={() => {
            onStep(index, -1)
          }}
        >
          <Icon name="up" size={16} />
          <span>Subir</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index === count - 1}
          onSelect={() => {
            onStep(index, 1)
          }}
        >
          <Icon name="down" size={16} />
          <span>Bajar</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!isInBar && isBarFull}
          onSelect={() => {
            onToggleBar(entry.to)
          }}
        >
          <span>{isInBar ? 'Quitar de la barra de abajo' : 'Poner en la barra de abajo'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
