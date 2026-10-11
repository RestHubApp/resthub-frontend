import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { HomeRedirect } from '@/features/shell/HomeRedirect'
import { AppShell } from '@/features/shell/AppShell'
import { PreviewPlatformGate } from '@/features/shell/PreviewPlatformGate'
import { RequireSession } from '@/features/shell/RequireSession'
import { paths, routePatterns } from '@/services/paths'
import { lazyRoute } from './lazyRoute'
import { PLATFORM } from './platformRoute'
import { PREVIEW } from './previewRoute'
import { RouteError } from './RouteError'
import { SCREENS } from './screens'
import type { Screen } from './screens/screenTypes'

/**
 * La ruta de una pantalla del registro, detrás de su guarda.
 *
 * El permiso es una comodidad de la interfaz: la autorizacion de verdad la
 * aplica el servidor en cada peticion, y esta guarda solo evita mostrar una
 * pantalla que va a responder 403. Es el mismo del registro que muestra la
 * entrada del menu.
 */
function screenRoute({ path, load, permission, public: isPublic }: Screen): RouteObject {
  const route = { path, ...lazyRoute(load) }
  return isPublic === true ? route : { element: <RequireSession permission={permission} />, children: [route] }
}

export const router = createBrowserRouter(
  [
    // En una pestaña de vista previa, la puerta muestra un aviso en vez del área.
    { element: <PreviewPlatformGate />, ErrorBoundary: RouteError, children: [PLATFORM] },
    { ...PREVIEW, ErrorBoundary: RouteError },
    {
      path: routePatterns.home,
      element: <AppShell screens={SCREENS} />,
      ErrorBoundary: RouteError,
      children: [
        { index: true, Component: HomeRedirect },
        ...SCREENS.map(screenRoute),
        // Cualquier ruta que no exista lleva al inicio de cada cuenta, no a un error.
        { path: '*', element: <Navigate to={paths.home} replace /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)
