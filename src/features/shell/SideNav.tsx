import type { Session } from '@/api/types'
import { paths } from '@/services/paths'
import { scopeName, spokenScope } from './accountLabels'
import { Brand } from './Brand'
import type { NavEntry } from './navigation'
import { NavList } from './NavList'
import { QuickAppearanceButton } from './quick/QuickAppearanceButton'
import { QuickSearchField } from './quick/QuickSearchField'
import { ScopeName } from './ScopeName'
import { SessionActions } from './SessionActions'

interface SideNavProps {
  readonly entries: readonly NavEntry[]
  readonly account: Session
}

/** La barra lateral de escritorio, donde trabaja el encargado (y la administración del sistema). */
export function SideNav({ entries, account }: SideNavProps) {
  return (
    // `data-side-nav` y el relleno de abajo dejan sitio al botón de accesibilidad (ver `index.css`).
    // La columna pinta el fondo de punta a punta; adentro, el menú queda fijo al desplazarse.
    <div className="hidden border-r bg-card lg:block">
      <aside data-side-nav="" className="sticky top-[var(--preview-banner-h,0px)] flex h-[calc(100vh_-_var(--preview-banner-h,0px))] flex-col gap-3 p-4 pb-18">
        <div className="px-1 pt-1">
          <Brand to={paths.home} />
        </div>
        <ScopeName name={scopeName(account)} variant="sidebar" spokenLabel={spokenScope(account)} />
        <QuickSearchField />
        <nav aria-label="Navegación principal" className="scroll-shadow -mx-1 flex-1 overflow-y-auto px-1">
          <NavList entries={entries} />
        </nav>
        <QuickAppearanceButton variant="row" />
        <SessionActions account={account} />
      </aside>
    </div>
  )
}
