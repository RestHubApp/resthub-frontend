import { NavLink } from 'react-router'

import Icon from '../../components/Icon'
import type { IconName } from '../../components/icons'

const TABS: readonly { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/panel', label: 'Indicadores', icon: 'indicadores', end: true },
  { to: '/panel/reposicion', label: 'Reposición', icon: 'comprar' },
  { to: '/panel/ia', label: 'Auditoría de IA', icon: 'ia' },
]

const BASE =
  'inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

/** Las tres pantallas del panel. La actual se marca con fondo, no solo con color. */
export default function PanelTabs() {
  return (
    <nav aria-label="Secciones del panel" className="-mx-1 overflow-x-auto px-1">
      <ul className="m-0 flex w-max list-none gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                isActive
                  ? `${BASE} bg-card font-semibold text-foreground shadow-sm`
                  : `${BASE} text-muted-foreground hover:text-foreground`
              }
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
