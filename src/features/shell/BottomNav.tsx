import Icon from '../../components/Icon'
import type { CurrentUserResponse } from '../../api/types'
import MoreSheet from './MoreSheet'
import type { NavEntry } from './navigation'
import PreloadLink from './PreloadLink'
import { TAB_ACTIVE, TAB_IDLE } from './tabStyles'

interface BottomNavProps {
  readonly entries: readonly NavEntry[]
  readonly account: CurrentUserResponse
}

// Cuatro pantallas y "Más" es lo que entra en un celular de 360 px con
// etiquetas legibles y blancos de al menos 44 px de ancho.
const VISIBLES = 4

function tabClass({ isActive }: { isActive: boolean }): string {
  return isActive ? TAB_ACTIVE : TAB_IDLE
}

/**
 * La navegacion del celular, abajo, al alcance del pulgar.
 *
 * El mesero trabaja con una mano y el celular en la otra: un menu arriba a la
 * izquierda es el rincon mas lejano de la pantalla. Lo que no entra en la
 * barra, el perfil y la salida van en "Más". `data-bottom-nav` lo usa
 * index.css para subir el boton de accesibilidad por encima de la barra.
 */
export default function BottomNav({ entries, account }: BottomNavProps) {
  const visibles = entries.slice(0, VISIBLES)
  const resto = entries.slice(VISIBLES)

  return (
    <nav
      aria-label="Navegación principal"
      data-bottom-nav=""
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="m-0 flex list-none gap-1 p-0">
        {visibles.map((entry) => (
          <li key={entry.to} className="flex flex-1">
            <PreloadLink to={entry.to} className={tabClass}>
              <Icon name={entry.icon} size={22} />
              <span className="max-w-full truncate">{entry.label}</span>
            </PreloadLink>
          </li>
        ))}
        <li className="flex flex-1">
          <MoreSheet entries={resto} account={account} />
        </li>
      </ul>
    </nav>
  )
}
