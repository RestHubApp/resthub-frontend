import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router'

import { asDefault } from '@/components/lazyNamed'
import { EmptyState } from '@/components/EmptyState'
import { PreviewEntryPending } from '@/features/auth/PreviewEntryPending'
import { AppShell } from '@/features/shell/AppShell'
import { HomeRedirect } from '@/features/shell/HomeRedirect'
import { PreviewPlatformGate } from '@/features/shell/PreviewPlatformGate'
import { RequireSession } from '@/features/shell/RequireSession'
import type { ScreenPreload } from '@/features/shell/screenPreload'

const PANEL = 'insights.read'
// Lo que hace el mesero: tomar pedidos, ver la cocina, imprimir.
const MESERO = 'orders.take'
const consultar = (cargar: () => Promise<Record<string, (() => void) | undefined>>, nombre: string) => () => {
  void cargar().then((modulo) => { modulo[nombre]?.() })
}

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
 * Cada pantalla se carga al abrirla; ni el acceso, ni la toma de pedidos, ni
 * el tablero, el inventario o el panel forman parte del archivo inicial.
 */
const PANTALLAS: readonly LazyScreen[] = [
  { path: 'perfil', load: asDefault(() => import('@/features/auth/ProfileView'), 'ProfileView') },
  { path: 'tablero', permission: 'orders.read_all', load: asDefault(() => import('@/features/orders/BoardView'), 'BoardView'), prefetch: consultar(() => import('@/features/orders/prefetchOrders'), 'prefetchBoard') },
  { path: 'tablero/historial', permission: 'orders.read_all', load: asDefault(() => import('@/features/orders/HistoryView'), 'HistoryView') },
  { path: 'cocina', permission: MESERO, load: asDefault(() => import('@/features/orders/KitchenView'), 'KitchenView'), prefetch: consultar(() => import('@/features/orders/prefetchOrders'), 'prefetchKitchen') },
  { path: 'imprimir/:orderId/:kind', permission: MESERO, load: asDefault(() => import('@/features/orders/PrintView'), 'PrintView') },
  { path: 'comprobantes', permission: 'billing.manage', load: asDefault(() => import('@/features/billing/BillingView'), 'BillingView') },
  { path: 'comprobantes/:invoiceId/imprimir', permission: 'billing.issue', load: asDefault(() => import('@/features/billing/InvoicePrintView'), 'InvoicePrintView') },
  { path: 'reservas', permission: 'reservations.read', load: asDefault(() => import('@/features/reservations/ReservationsView'), 'ReservationsView') },
  { path: 'clientes', permission: 'customers.read', load: asDefault(() => import('@/features/customers/CustomersView'), 'CustomersView') },
  { path: 'caja', permission: 'cash.manage', load: asDefault(() => import('@/features/cash/CashView'), 'CashView'), prefetch: consultar(() => import('@/features/cash/prefetchCash'), 'prefetchCash') },
  { path: 'menu', permission: 'menu.manage', load: asDefault(() => import('@/features/menu/MenuView'), 'MenuView'), prefetch: consultar(() => import('@/features/menu/prefetchMenu'), 'prefetchMenu') },
  { path: 'mesas', permission: 'tables.manage', load: asDefault(() => import('@/features/tables/TablesView'), 'TablesView'), prefetch: consultar(() => import('@/features/tables/prefetchTables'), 'prefetchTables') },
  { path: 'inventario', permission: 'inventory.read', load: asDefault(() => import('@/features/inventory/InventoryView'), 'InventoryView'), prefetch: consultar(() => import('@/features/inventory/prefetchInventory'), 'prefetchInventory') },
  { path: 'inventario/recetas/:menuItemId', permission: 'inventory.read', load: asDefault(() => import('@/features/inventory/RecipeEditorView'), 'RecipeEditorView') },
  { path: 'personal', permission: 'staff.manage', load: asDefault(() => import('@/features/staff/StaffView'), 'StaffView'), prefetch: consultar(() => import('@/features/staff/prefetchStaff'), 'prefetchStaff') },
  { path: 'roles', permission: 'roles.manage', load: asDefault(() => import('@/features/roles/RolesView'), 'RolesView'), prefetch: consultar(() => import('@/features/roles/prefetchRoles'), 'prefetchRoles') },
  { path: 'panel', permission: PANEL, load: asDefault(() => import('@/features/insights/InsightsView'), 'InsightsView'), prefetch: consultar(() => import('@/features/insights/prefetchInsights'), 'prefetchInsights') },
  { path: 'panel/reposicion', permission: PANEL, load: asDefault(() => import('@/features/insights/RestockView'), 'RestockView') },
  { path: 'panel/ia', permission: PANEL, load: asDefault(() => import('@/features/insights/AiAuditView'), 'AiAuditView') },
]

/** Pedidos también se precarga con intención de navegar, sin descargarse al arrancar. */
const PRECARGAS: readonly ScreenPreload[] = [
  { path: 'pedidos', permission: MESERO, load: asDefault(() => import('@/features/orders/OrdersView'), 'OrdersView'), prefetch: consultar(() => import('@/features/orders/prefetchOrders'), 'prefetchFloor') },
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
  ...plataforma(asDefault(() => import('@/features/platform/PlatformShell'), 'PlatformShell')),
  children: [
    { path: 'acceso', ...plataforma(asDefault(() => import('@/features/platform/PlatformLoginView'), 'PlatformLoginView')) },
    {
      ...plataforma(asDefault(() => import('@/features/platform/RequirePlatformSession'), 'RequirePlatformSession')),
      children: [
        { index: true, ...plataforma(asDefault(() => import('@/features/platform/RestaurantsView'), 'RestaurantsView')) },
        { path: 'restaurantes/nuevo', ...plataforma(asDefault(() => import('@/features/platform/NewRestaurantView'), 'NewRestaurantView')) },
        { path: 'restaurantes/:restaurantId', ...plataforma(asDefault(() => import('@/features/platform/RestaurantDetailView'), 'RestaurantDetailView')) },
        { path: 'bitacora', ...plataforma(asDefault(() => import('@/features/platform/ActivityView'), 'ActivityView')) },
        { path: 'vista-previa', ...plataforma(asDefault(() => import('@/features/platform/PreviewView'), 'PreviewView')) },
        { path: 'observabilidad', ...plataforma(asDefault(() => import('@/features/platform/observability/ObservabilityView'), 'ObservabilityView')) },
      ],
    },
    { path: '*', element: <Navigate to="/plataforma" replace /> },
  ],
}

/**
 * La pestaña que abre «Ver como…» en el área de plataforma.
 *
 * Va fuera de las dos guardas: canjea el código de un solo uso (el `loader`,
 * que corre una vez por carga) y lleva al armazón del restaurante con la
 * sesión de vista previa, que vive solo en esta pestaña.
 */
const VISTA_PREVIA: RouteObject = {
  path: '/vista-previa',
  hydrateFallbackElement: <PreviewEntryPending />,
  lazy: {
    loader: async () => (await import('@/features/auth/previewEntry')).previewEntryLoader,
    Component: async () => (await asDefault(() => import('@/features/auth/PreviewEntryView'), 'PreviewEntryView')()).default,
  },
}

const router = createBrowserRouter(
  [
    // En una pestaña de vista previa, la puerta muestra un aviso en vez del área.
    { element: <PreviewPlatformGate />, children: [PLATAFORMA] },
    VISTA_PREVIA,
    {
      path: '/',
      element: <AppShell screens={PRECARGAS} />,
      children: [
        { index: true, Component: HomeRedirect },
        { path: 'acceso', ...plataforma(asDefault(() => import('@/features/auth/LoginView'), 'LoginView')) },
        // Pública: se lee antes de entrar o desde la pantalla que pide aceptarla.
        { path: 'privacidad', ...plataforma(asDefault(() => import('@/features/legal/PrivacyView'), 'PrivacyView')) },
        {
          element: <RequireSession permission="orders.take" />,
          children: [
            { path: 'pedidos', ...plataforma(asDefault(() => import('@/features/orders/OrdersView'), 'OrdersView')) },
            { path: 'pedidos/nuevo', ...plataforma(asDefault(() => import('@/features/orders/NewOrderView'), 'NewOrderView')) },
            { path: 'pedidos/:orderId', ...plataforma(asDefault(() => import('@/features/orders/OrderDetailView'), 'OrderDetailView')) },
            { path: 'pedidos/:orderId/agregar', ...plataforma(asDefault(() => import('@/features/orders/AddItemsView'), 'AddItemsView')) },
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

export { router }
