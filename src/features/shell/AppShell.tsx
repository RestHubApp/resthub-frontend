import { Outlet } from 'react-router'

import AccessibilityWidget from '../../components/AccessibilityWidget'
import { useSession } from '../../store/session'
import BottomNav from './BottomNav'
import Brand from './Brand'
import { entriesFor } from './navigation'
import RestaurantName from './RestaurantName'
import { type ScreenPreload, ScreenPreloadContext } from './screenPreload'
import SideNav from './SideNav'
import ToastStack from './ToastStack'
import { useAccountRefresh } from './useAccountRefresh'
import { useIdlePreload } from './useIdlePreload'
import { useSessionRenewal } from './useSessionRenewal'

// Es estatico: se crea una vez y no depende de props ni del estado.
const SKIP_LINK = (
  <a
    href="#contenido"
    className="sr-only rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
  >
    Saltar al contenido
  </a>
)

const SIN_PANTALLAS: readonly ScreenPreload[] = []

interface AppShellProps {
  /** Las pantallas que se adelantan: sus archivos en ratos libres, sus datos al acercarse al enlace. */
  readonly screens?: readonly ScreenPreload[]
}

/**
 * El armazon de todas las pantallas.
 *
 * Sin sesion solo esta el acceso: la marca arriba y el formulario al centro.
 * Con sesion hay dos disposiciones. En pantallas anchas, la laptop del
 * encargado, el menu va en una barra lateral. En el celular del mesero va en
 * una barra inferior, y arriba queda el nombre del restaurante; el contenido
 * reserva abajo el alto de esa barra para que nada quede tapado.
 */
export default function AppShell({ screens = SIN_PANTALLAS }: AppShellProps) {
  const account = useSession((state) => state.account)
  useAccountRefresh()
  useSessionRenewal()
  useIdlePreload(screens)

  if (account === null) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        {SKIP_LINK}
        <AccessibilityWidget />
        <header className="mx-auto flex w-full max-w-5xl px-4 pt-5 sm:px-6">
          <Brand to="/acceso" />
        </header>
        <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col px-4 py-6 outline-none sm:px-6">
          <Outlet />
        </main>
      </div>
    )
  }

  const entries = entriesFor(account.permissions)

  return (
    <ScreenPreloadContext value={screens}>
      <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
        {SKIP_LINK}
        <AccessibilityWidget />
        <ToastStack />
        <SideNav entries={entries} account={account} />

        <div className="flex min-h-dvh min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 lg:hidden">
            <Brand to="/" compact />
            <RestaurantName name={account.restaurant.name} variant="header" />
          </header>
          <main
            id="contenido"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-6 pb-28 outline-none sm:px-6 lg:pb-8"
          >
            <Outlet />
          </main>
        </div>

        <BottomNav entries={entries} account={account} />
      </div>
    </ScreenPreloadContext>
  )
}
