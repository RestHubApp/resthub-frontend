import type { ComponentProps, ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import EmptyState from '../components/EmptyState'
import LoginView from '../features/auth/LoginView'
import AddItemsView from '../features/orders/AddItemsView'
import NewOrderView from '../features/orders/NewOrderView'
import OrderDetailView from '../features/orders/OrderDetailView'
import OrdersView from '../features/orders/OrdersView'
import AppShell from '../features/shell/AppShell'
import HomeRedirect from '../features/shell/HomeRedirect'
import RequireSession from '../features/shell/RequireSession'

type Permission = NonNullable<ComponentProps<typeof RequireSession>['permission']>

const PANEL: Permission = 'insights.read'

// Al abrir la aplicacion directo en una pantalla perezosa (recargar el
// tablero), esto se ve dentro del armazon mientras llega su archivo.
const CARGANDO = <EmptyState title="Cargando…" />

function perezosa(path: string, load: () => Promise<{ default: ComponentType }>): RouteObject {
  return { path, hydrateFallbackElement: CARGANDO, lazy: { Component: async () => (await load()).default } }
}

/**
 * Una pantalla que exige un permiso y que se descarga recién al abrirla.
 *
 * El permiso es una comodidad de la interfaz: la autorizacion de verdad la
 * aplica el servidor en cada peticion, y esta guarda solo evita mostrar una
 * pantalla que va a responder 403. Es el mismo que muestra la entrada del menu.
 *
 * Las pantallas del encargado van en su propio archivo: el celular del
 * mesero arranca con el acceso y la toma de pedidos, y nunca baja el tablero,
 * el inventario ni el panel.
 */
function conPermiso(path: string, load: () => Promise<{ default: ComponentType }>, permission: Permission): RouteObject {
  return {
    element: <RequireSession permission={permission} />,
    children: [perezosa(path, load)],
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
          children: [perezosa('perfil', () => import('../features/auth/ProfileView'))],
        },
        {
          element: <RequireSession permission="orders.take" />,
          children: [
            { path: 'pedidos', Component: OrdersView },
            { path: 'pedidos/nuevo', Component: NewOrderView },
            { path: 'pedidos/:orderId', Component: OrderDetailView },
            { path: 'pedidos/:orderId/agregar', Component: AddItemsView },
          ],
        },
        conPermiso('tablero', () => import('../features/orders/BoardView'), 'orders.read_all'),
        conPermiso('tablero/historial', () => import('../features/orders/HistoryView'), 'orders.read_all'),
        conPermiso('menu', () => import('../features/menu/MenuView'), 'menu.manage'),
        conPermiso('mesas', () => import('../features/tables/TablesView'), 'tables.manage'),
        conPermiso('inventario', () => import('../features/inventory/InventoryView'), 'inventory.read'),
        conPermiso('inventario/recetas/:menuItemId', () => import('../features/inventory/RecipeEditorView'), 'inventory.read'),
        conPermiso('personal', () => import('../features/staff/StaffView'), 'staff.manage'),
        conPermiso('panel', () => import('../features/insights/InsightsView'), PANEL),
        conPermiso('panel/reposicion', () => import('../features/insights/RestockView'), PANEL),
        conPermiso('panel/ia', () => import('../features/insights/AiAuditView'), PANEL),
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
