import type { ComponentProps, ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import LoginView from '../features/auth/LoginView'
import ProfileView from '../features/auth/ProfileView'
import AppShell from '../features/shell/AppShell'
import ComingSoonView from '../features/shell/ComingSoonView'
import HomeRedirect from '../features/shell/HomeRedirect'
import RequireSession from '../features/shell/RequireSession'
import StaffView from '../features/staff/StaffView'

/**
 * Una pantalla que exige un permiso.
 *
 * Es una comodidad de la interfaz: la autorizacion de verdad la aplica el
 * servidor en cada peticion, y esta guarda solo evita mostrar una pantalla que
 * va a responder 403. El permiso es el mismo que muestra la entrada del menu.
 */
function conPermiso(
  path: string,
  Component: ComponentType,
  permission: NonNullable<ComponentProps<typeof RequireSession>['permission']>,
): RouteObject {
  return {
    element: <RequireSession permission={permission} />,
    children: [{ path, Component }],
  }
}

const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: AppShell,
      children: [
        { index: true, Component: HomeRedirect },
        { path: 'acceso', Component: LoginView },
        {
          element: <RequireSession />,
          children: [{ path: 'perfil', Component: ProfileView }],
        },
        // Las pantallas sin construir ya tienen su ruta y su permiso: se
        // reemplaza ComingSoonView por la vista cuando exista.
        conPermiso('pedidos', ComingSoonView, 'orders.take'),
        conPermiso('tablero', ComingSoonView, 'orders.read_all'),
        conPermiso('menu', ComingSoonView, 'menu.manage'),
        conPermiso('mesas', ComingSoonView, 'tables.manage'),
        conPermiso('inventario', ComingSoonView, 'inventory.read'),
        conPermiso('personal', StaffView, 'staff.manage'),
        conPermiso('panel', ComingSoonView, 'insights.read'),
        // Cualquier ruta que no exista lleva al inicio de cada cuenta, no a un error.
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  },
)

export default router
