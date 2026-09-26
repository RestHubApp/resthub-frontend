import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import EmptyState from '../components/EmptyState'
import LoginView from '../features/auth/LoginView'
import { prefetchCash } from '../features/cash/prefetchCash'
import { prefetchInsights } from '../features/insights/prefetchInsights'
import { prefetchInventory } from '../features/inventory/prefetchInventory'
import { prefetchMenu } from '../features/menu/prefetchMenu'
import AddItemsView from '../features/orders/AddItemsView'
import NewOrderView from '../features/orders/NewOrderView'
import OrderDetailView from '../features/orders/OrderDetailView'
import OrdersView from '../features/orders/OrdersView'
import { prefetchBoard, prefetchFloor, prefetchKitchen } from '../features/orders/prefetchOrders'
import { prefetchRoles } from '../features/roles/prefetchRoles'
import AppShell from '../features/shell/AppShell'
import HomeRedirect from '../features/shell/HomeRedirect'
import RequireSession from '../features/shell/RequireSession'
import type { ScreenPreload } from '../features/shell/screenPreload'
import { prefetchStaff } from '../features/staff/prefetchStaff'
import { prefetchTables } from '../features/tables/prefetchTables'

const PANEL = 'insights.read'
// Lo que hace el mesero: tomar pedidos, ver la cocina, imprimir.
const MESERO = 'orders.take'

// Al abrir la aplicacion directo en una pantalla perezosa (recargar el
// tablero), esto se ve dentro del armazon mientras llega su archivo.
const CARGANDO = <EmptyState title="Cargando…" />

/** Una pantalla que se descarga recién al abrirla (o antes, si el armazón la adelanta). */
type LazyScreen = Omit<ScreenPreload, 'load'> & { readonly load: () => Promise<{ default: ComponentType }> }

/**
 * Las pantallas que se descargan aparte, con el permiso que exige cada una.
 *
 * Es la única lista de sus `import()`: de acá salen las rutas y lo que el
 * armazón adelanta, así que una pantalla nueva no puede quedar en una y
 * faltar en la otra.
 *
 * Las pantallas del encargado van en su propio archivo: el celular del
 * mesero arranca con el acceso y la toma de pedidos, y nunca baja el tablero,
 * el inventario ni el panel.
 */
const PANTALLAS: readonly LazyScreen[] = [
  { path: 'perfil', load: () => import('../features/auth/ProfileView') },
  { path: 'tablero', permission: 'orders.read_all', load: () => import('../features/orders/BoardView'), prefetch: prefetchBoard },
  { path: 'tablero/historial', permission: 'orders.read_all', load: () => import('../features/orders/HistoryView') },
  { path: 'cocina', permission: MESERO, load: () => import('../features/orders/KitchenView'), prefetch: prefetchKitchen },
  { path: 'imprimir/:orderId/:kind', permission: MESERO, load: () => import('../features/orders/PrintView') },
  { path: 'comprobantes', permission: 'billing.manage', load: () => import('../features/billing/BillingView') },
  { path: 'comprobantes/:invoiceId/imprimir', permission: 'billing.issue', load: () => import('../features/billing/InvoicePrintView') },
  { path: 'reservas', permission: 'reservations.read', load: () => import('../features/reservations/ReservationsView') },
  { path: 'clientes', permission: 'customers.read', load: () => import('../features/customers/CustomersView') },
  { path: 'caja', permission: 'cash.manage', load: () => import('../features/cash/CashView'), prefetch: prefetchCash },
  { path: 'menu', permission: 'menu.manage', load: () => import('../features/menu/MenuView'), prefetch: prefetchMenu },
  { path: 'mesas', permission: 'tables.manage', load: () => import('../features/tables/TablesView'), prefetch: prefetchTables },
  { path: 'inventario', permission: 'inventory.read', load: () => import('../features/inventory/InventoryView'), prefetch: prefetchInventory },
  { path: 'inventario/recetas/:menuItemId', permission: 'inventory.read', load: () => import('../features/inventory/RecipeEditorView') },
  { path: 'personal', permission: 'staff.manage', load: () => import('../features/staff/StaffView'), prefetch: prefetchStaff },
  { path: 'roles', permission: 'roles.manage', load: () => import('../features/roles/RolesView'), prefetch: prefetchRoles },
  { path: 'panel', permission: PANEL, load: () => import('../features/insights/InsightsView'), prefetch: prefetchInsights },
  { path: 'panel/reposicion', permission: PANEL, load: () => import('../features/insights/RestockView') },
  { path: 'panel/ia', permission: PANEL, load: () => import('../features/insights/AiAuditView') },
]

/** Pedidos va en el archivo inicial: de esa pantalla solo se adelantan los datos. */
const PRECARGAS: readonly ScreenPreload[] = [
  { path: 'pedidos', permission: MESERO, prefetch: prefetchFloor },
  ...PANTALLAS,
]

/**
 * La ruta de una pantalla perezosa, detrás de su guarda.
 *
 * El permiso es una comodidad de la interfaz: la autorizacion de verdad la
 * aplica el servidor en cada peticion, y esta guarda solo evita mostrar una
 * pantalla que va a responder 403. Es el mismo que muestra la entrada del menu.
 */
function conPermiso({ path, load, permission }: LazyScreen): RouteObject {
  return {
    element: <RequireSession permission={permission} />,
    children: [
      { path, hydrateFallbackElement: CARGANDO, lazy: { Component: async () => (await load()).default } },
    ],
  }
}

/** Una pantalla del área de plataforma, que se descarga recién al abrirla. */
function plataforma(load: () => Promise<{ default: ComponentType }>) {
  return { hydrateFallbackElement: CARGANDO, lazy: { Component: async () => (await load()).default } } as const
}

/**
 * El área del administrador del sistema, aparte del armazón de un restaurante.
 *
 * Cada pantalla va en su propio archivo: el celular del mesero nunca baja este
 * código ni la sesión de plataforma. La guarda mira solo esa sesión; una
 * sesión de restaurante abierta no entra.
 */
const PLATAFORMA: RouteObject = {
  path: '/plataforma',
  ...plataforma(() => import('../features/platform/PlatformShell')),
  children: [
    { path: 'acceso', ...plataforma(() => import('../features/platform/PlatformLoginView')) },
    {
      ...plataforma(() => import('../features/platform/RequirePlatformSession')),
      children: [
        { index: true, ...plataforma(() => import('../features/platform/RestaurantsView')) },
        { path: 'restaurantes/nuevo', ...plataforma(() => import('../features/platform/NewRestaurantView')) },
        { path: 'restaurantes/:restaurantId', ...plataforma(() => import('../features/platform/RestaurantDetailView')) },
        { path: 'bitacora', ...plataforma(() => import('../features/platform/ActivityView')) },
      ],
    },
    { path: '*', element: <Navigate to="/plataforma" replace /> },
  ],
}

const router = createBrowserRouter(
  [
    PLATAFORMA,
    {
      path: '/',
      element: <AppShell screens={PRECARGAS} />,
      children: [
        { index: true, Component: HomeRedirect },
        { path: 'acceso', Component: LoginView },
        {
          element: <RequireSession permission="orders.take" />,
          children: [
            { path: 'pedidos', Component: OrdersView },
            { path: 'pedidos/nuevo', Component: NewOrderView },
            { path: 'pedidos/:orderId', Component: OrderDetailView },
            { path: 'pedidos/:orderId/agregar', Component: AddItemsView },
          ],
        },
        ...PANTALLAS.map(conPermiso),
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
