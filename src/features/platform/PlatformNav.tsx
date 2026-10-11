import { Link } from 'react-router'

import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/icons'
import { paths } from '@/services/paths'

interface Entry {
  readonly to: string
  readonly label: string
  readonly icon: IconName
  /** Otras rutas en las que la entrada sigue marcada: la ficha y el alta de un restaurante. */
  readonly within?: string
}

const ENTRIES: readonly Entry[] = [
  { to: paths.platform.home, label: 'Restaurantes', icon: 'restaurante', within: paths.platform.restaurant('') },
  { to: paths.platform.activity, label: 'Bitácora', icon: 'historial' },
  { to: paths.platform.preview, label: 'Vista previa', icon: 'ver' },
  { to: paths.platform.observability, label: 'Observabilidad', icon: 'observabilidad' },
]

const BASE =
  'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-background/60'

// La pantalla actual se marca con fondo y no solo con color.
const ACTIVE = `${BASE} bg-background text-foreground`
const INACTIVE = `${BASE} text-background/90 hover:bg-background/10`

function active(entry: Entry, pathname: string): boolean {
  return pathname === entry.to || (entry.within !== undefined && pathname.startsWith(entry.within))
}

interface PlatformNavProps {
  readonly pathname: string
}

/** Las pantallas del área, en la franja de arriba; en un celular angosto bajan a otra fila. */
export function PlatformNav({ pathname }: PlatformNavProps) {
  return (
    <nav aria-label="Administración del sistema" className="order-last w-full sm:order-none sm:w-auto">
      <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
        {ENTRIES.map((entry) => {
          const actual = active(entry, pathname)
          return (
            <li key={entry.to}>
              <Link to={entry.to} className={actual ? ACTIVE : INACTIVE} aria-current={actual ? 'page' : undefined}>
                <Icon name={entry.icon} size={18} />
                <span>{entry.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
