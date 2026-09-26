import { Link } from 'react-router'

import Icon from '../../components/Icon'
import type { IconName } from '../../components/icons'

interface Entry {
  readonly to: string
  readonly label: string
  readonly icon: IconName
  /** Otras rutas en las que la entrada sigue marcada: la ficha y el alta de un restaurante. */
  readonly within?: string
}

const ENTRADAS: readonly Entry[] = [
  { to: '/plataforma', label: 'Restaurantes', icon: 'restaurante', within: '/plataforma/restaurantes/' },
  { to: '/plataforma/bitacora', label: 'Bitácora', icon: 'historial' },
]

const BASE =
  'inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-background/60'

// La pantalla actual se marca con fondo y no solo con color.
const ACTIVA = `${BASE} bg-background text-foreground`
const INACTIVA = `${BASE} text-background/90 hover:bg-background/10`

function activa(entrada: Entry, pathname: string): boolean {
  return pathname === entrada.to || (entrada.within !== undefined && pathname.startsWith(entrada.within))
}

interface PlatformNavProps {
  readonly pathname: string
}

/** Las dos pantallas del área, en la franja de arriba: caben también en el celular. */
export default function PlatformNav({ pathname }: PlatformNavProps) {
  return (
    <nav aria-label="Administración del sistema" className="order-last w-full sm:order-none sm:w-auto">
      <ul className="m-0 flex list-none gap-1 p-0">
        {ENTRADAS.map((entrada) => {
          const actual = activa(entrada, pathname)
          return (
            <li key={entrada.to}>
              <Link to={entrada.to} className={actual ? ACTIVA : INACTIVA} aria-current={actual ? 'page' : undefined}>
                <Icon name={entrada.icon} size={18} />
                <span>{entrada.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
