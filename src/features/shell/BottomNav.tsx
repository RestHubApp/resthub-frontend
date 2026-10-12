import { ShellIcon } from './ShellIcon'
import type { Session } from '@/api/types'
import { MoreSheet } from './MoreSheet'
import type { NavEntry } from './navigation'
import { EntryLink } from './EntryLink'
import { TAB_ACTIVE, TAB_IDLE } from './tabStyles'

interface BottomNavProps {
  /** Las pantallas de la barra, en el orden del menú (hasta cuatro). */
  readonly bar: readonly NavEntry[]
  /** Las que no entraron: van en «Más». */
  readonly rest: readonly NavEntry[]
  readonly account: Session
}

function tabClass(isCurrent: boolean): string {
  return isCurrent ? TAB_ACTIVE : TAB_IDLE
}

/**
 * La navegacion del celular, abajo, al alcance del pulgar.
 *
 * El mesero trabaja con una mano y el celular en la otra: un menu arriba a la
 * izquierda es el rincon mas lejano de la pantalla. Lo que no entra en la
 * barra, el perfil y la salida van en "Más". Cuatro pantallas y "Más" es lo
 * que entra en un celular de 360 px con etiquetas legibles y blancos de al
 * menos 44 px de ancho; cuáles cuatro lo elige cada cuenta en «Apariencia». `data-bottom-nav` lo usa
 * index.css para subir el boton de accesibilidad por encima de la barra.
 */
export function BottomNav({ bar, rest, account }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación principal"
      data-bottom-nav=""
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card px-2 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      <ul className="m-0 flex list-none gap-1 p-0">
        {bar.map((entry) => (
          <li key={entry.to} className="flex flex-1">
            <EntryLink entry={entry} className={tabClass}>
              <ShellIcon name={entry.icon} size={22} />
              <span className="max-w-full truncate">{entry.label}</span>
            </EntryLink>
          </li>
        ))}
        <li className="flex flex-1">
          <MoreSheet entries={rest} account={account} />
        </li>
      </ul>
    </nav>
  )
}
