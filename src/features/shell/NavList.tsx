import { ShellIcon } from './ShellIcon'
import type { NavEntry } from './navigation'
import { EntryBadge } from './EntryBadge'
import { EntryLink } from './EntryLink'

interface NavListProps {
  readonly entries: readonly NavEntry[]
  /** Lo usa el panel del celular para cerrarse al elegir una pantalla. */
  readonly onNavigate?: () => void
}

const BASE =
  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm lg:min-h-10 lg:py-1.5 in-data-[density=compact]:pointer-fine:lg:min-h-9 in-data-[density=compact]:pointer-fine:lg:py-1 font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

function linkClass(isCurrent: boolean): string {
  return isCurrent
    ? `${BASE} bg-primary text-primary-foreground`
    : `${BASE} text-foreground hover:bg-muted`
}

/**
 * Las entradas del menu, en columna.
 *
 * La misma lista sirve a la barra lateral y al panel "Más" del celular.
 * El enlace marca la pantalla actual con `aria-current`, asi que el lector de
 * pantalla la anuncia sin depender del color.
 */
export function NavList({ entries, onNavigate }: NavListProps) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0 lg:gap-0.5">
      {entries.map((entry) => (
        <li key={entry.to}>
          <EntryLink entry={entry} className={linkClass} onClick={onNavigate}>
            <ShellIcon name={entry.icon} size={18} />
            <span>{entry.label}</span>
            <EntryBadge entry={entry} />
          </EntryLink>
        </li>
      ))}
    </ul>
  )
}
