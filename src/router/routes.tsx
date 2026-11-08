import { Navigate, type RouteObject } from 'react-router'

import { HomeRedirect } from '@/features/shell/HomeRedirect'
import { AppShell } from '@/features/shell/AppShell'
import { RequireSession } from '@/features/shell/RequireSession'
import { paths, routePatterns } from '@/services/paths'
import { lazyScreen } from './lazyRoute'
import { PREVIEW } from './previewRoute'

import { RouteBoundary } from './RouteBoundary'
import { ScreenOutlet } from './ScreenOutlet'
import { SCREENS } from './screens'
import { SETUP_VIEWS } from './setupViews'
import type { Screen } from './screens/screenTypes'

/**
 * La ruta de una pantalla del registro, detrás de su guarda.
 *
 * El permiso es una comodidad de la interfaz: la autorizacion de verdad la
 * aplica el servidor en cada peticion, y esta guarda solo evita mostrar una
 * pantalla que va a responder 403. Es el mismo del registro que muestra la
 * entrada del menu. Vale igual para una pantalla del restaurante que para una
 * de la administración del sistema.
 */
function screenRoute({ path, load, permission, public: isPublic }: Screen): RouteObject {
  const route = { path, element: lazyScreen(load) }
  return isPublic === true ? route : { element: <RequireSession permission={permission} />, children: [route] }
}

/**
 * Las rutas de la aplicación, en modo declarativo (`useRoutes` dentro de
 * `BrowserRouter`, ver `AppRoutes`). El modo de datos (`createBrowserRouter`)
 * sumaba unos 20 kB comprimidos al archivo inicial por funciones que no se
 * usan (loaders, actions, fetchers) y dejaba `/pedidos` al borde de la nota A+.
 */
export const routes: RouteObject[] = [
  PREVIEW,
  {
    path: routePatterns.home,
    element: (
      <RouteBoundary>
        <AppShell screens={SCREENS} setupViews={SETUP_VIEWS} />
      </RouteBoundary>
    ),
    children: [
      {
        element: <ScreenOutlet />,
        children: [
          { index: true, element: <HomeRedirect /> },
          ...SCREENS.map(screenRoute),
          // El acceso del equipo de RestHub ya no es otro: es el de todos.
          { path: routePatterns.platformLogin, element: <Navigate to={paths.login} replace /> },
          // Cualquier ruta que no exista lleva al inicio de cada cuenta, no a un error.
          { path: '*', element: <Navigate to={paths.home} replace /> },
        ],
      },
    ],
  },
]
