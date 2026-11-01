import { NavLink } from 'react-router'

import { Icon, type IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'
import { paths } from '@/services/paths'

const TABS: readonly { to: string; label: string; icon: IconGlyph; end: boolean }[] = [
  { to: paths.insights.overview, label: 'Indicadores', icon: icons.indicators, end: true },
  { to: paths.insights.restock, label: 'Reposición', icon: icons.buy, end: false },
  { to: paths.insights.aiAudit, label: 'Decisiones de la IA', icon: icons.ai, end: false },
]

const BASE =
  'inline-flex min-h-9 items-center gap-2 rounded-md px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'

/** Las tres pantallas del panel. La actual se marca con fondo, no solo con color. */
export function PanelTabs() {
  return (
    <nav aria-label="Secciones del panel" className="-mx-1 overflow-x-auto px-1 [mask-image:linear-gradient(to_right,black_85%,transparent)] sm:[mask-image:none]">
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
              <Icon glyph={tab.icon} size={16} />
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
