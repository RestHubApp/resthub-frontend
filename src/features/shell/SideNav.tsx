import type { CurrentUserResponse } from '../../api/types'
import Brand from './Brand'
import type { NavEntry } from './navigation'
import NavList from './NavList'
import RestaurantName from './RestaurantName'
import SessionActions from './SessionActions'

interface SideNavProps {
  readonly entries: readonly NavEntry[]
  readonly account: CurrentUserResponse
}

/** La barra lateral de escritorio, donde trabaja el encargado. */
export default function SideNav({ entries, account }: SideNavProps) {
  return (
    // La columna pinta el fondo de punta a punta; adentro, el menú queda fijo al desplazarse.
    <div className="hidden border-r bg-card lg:block">
      <aside className="sticky top-0 flex h-screen flex-col gap-5 p-4">
        <div className="px-1 pt-1">
          <Brand to="/" />
        </div>
        <RestaurantName name={account.restaurant.name} variant="sidebar" />
        <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto">
          <NavList entries={entries} />
        </nav>
        <SessionActions fullName={account.user.full_name} roleLabel={account.user.role_label} />
      </aside>
    </div>
  )
}
