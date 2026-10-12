import { Checkbox } from '@/components/ui/checkbox'
import { ShellIcon } from '@/features/shell/ShellIcon'
import type { NavEntry } from '@/features/shell/navigation'
import { MoveButton } from './MoveButton'

interface MenuRowProps {
  readonly entry: NavEntry
  readonly index: number
  readonly count: number
  readonly isInBar: boolean
  /** La barra de abajo ya tiene sus cuatro: esta, que no está en ella, no puede entrar. */
  readonly isBarFull: boolean
  readonly onMove: (index: number, step: -1 | 1) => void
  readonly onToggleBar: (path: string) => void
}

// La casilla de Radix es un <button>: se nombra con `aria-labelledby` (la pantalla y el texto «En la
// barra») y la etiqueta apunta a ella con `htmlFor`, como en `StockRulesCard`.
/** Una pantalla del menú: su lugar, si va en la barra de abajo y los botones para subirla o bajarla. */
export function MenuRow({ entry, index, count, isInBar, isBarFull, onMove, onToggleBar }: MenuRowProps) {
  const nameId = `menu-name-${entry.to}`
  const barId = `menu-bar-${entry.to}`
  const checkboxId = `menu-check-${entry.to}`
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card px-3 py-2">
      <span className="flex min-w-0 flex-1 items-center gap-3 font-medium">
        <ShellIcon name={entry.icon} size={18} className="shrink-0 text-muted-foreground" />
        <span id={nameId} className="min-w-0 truncate">
          {entry.label}
        </span>
      </span>
      <span className="flex min-h-11 items-center gap-2 text-sm">
        <Checkbox
          id={checkboxId}
          checked={isInBar}
          disabled={!isInBar && isBarFull}
          aria-labelledby={`${nameId} ${barId}`}
          onCheckedChange={() => {
            onToggleBar(entry.to)
          }}
        />
        <label htmlFor={checkboxId} id={barId} className="cursor-pointer">
          En la barra
        </label>
      </span>
      <span className="flex gap-1">
        <MoveButton
          path={entry.to}
          label={entry.label}
          step={-1}
          isAtEdge={index === 0}
          onMove={() => {
            onMove(index, -1)
          }}
        />
        <MoveButton
          path={entry.to}
          label={entry.label}
          step={1}
          isAtEdge={index === count - 1}
          onMove={() => {
            onMove(index, 1)
          }}
        />
      </span>
    </li>
  )
}
