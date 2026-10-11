import type { ComponentType } from 'react'

import { PERMISSION } from '@/api/permissions'
import { asDefault } from '@/components/lazyNamed'
import type { ShellScreen } from '@/features/shell/shellScreens'
import { routePatterns } from '@/services/paths'

/** Una pantalla del restaurante: lo que el router, el menú y las guardas saben de ella. */
export interface Screen extends ShellScreen {
  /** Se descarga recién al abrirla (o antes, si el armazón la adelanta). */
  readonly load: () => Promise<{ default: ComponentType }>
  /** Abierta a todos, también sin sesión. Sin esto, la ruta exige sesión (y el permiso, si lo declara). */
  readonly public?: true
}

// Los datos de una pantalla se precargan con el mismo módulo que la pantalla
// necesita al abrirse; el nombre es el de la función que exporta.
const prefetchOf = (load: () => Promise<Record<string, (() => void) | undefined>>, name: string) => () => {
  void load().then((module) => {
    module[name]?.()
  })
}

/**
 * Las pantallas del restaurante, en un solo lugar.
 *
 * Es la única fuente de la ruta, el permiso, la carga y la entrada del menú de
 * cada una: de acá salen las rutas del router, las guardas de permiso, el menú
 * lateral e inferior y lo que el armazón adelanta al acercarse a un enlace. Una
 * pantalla nueva es una línea acá y no puede quedar en una lista y faltar en
 * otra.
 *
 * El orden es el del menú: lo primero es lo que el mesero abre cien veces por
 * turno, y las primeras cuatro entradas son las de la barra inferior del
 * celular. Ninguna forma parte del archivo inicial: cada una se descarga al
 * abrirla.
 */
export const SCREENS: readonly Screen[] = [
  { path: routePatterns.login, public: true, load: asDefault(() => import('@/features/auth/LoginView'), 'LoginView') },
  // Pública: se lee antes de entrar o desde la pantalla que pide aceptarla.
  { path: routePatterns.privacy, public: true, load: asDefault(() => import('@/features/legal/PrivacyView'), 'PrivacyView') },
  { path: routePatterns.profile, load: asDefault(() => import('@/features/auth/ProfileView'), 'ProfileView') },
  {
    path: routePatterns.orders,
    permission: PERMISSION.ordersTake,
    nav: {
      label: 'Pedidos',
      icon: 'pedido',
      description: 'Tomar pedidos por mesa o para llevar, enviarlos a cocina y marcarlos servidos.',
    },
    load: asDefault(() => import('@/features/orders/OrdersView'), 'OrdersView'),
    prefetch: prefetchOf(() => import('@/features/orders/prefetchOrders'), 'prefetchFloor'),
  },
  { path: routePatterns.newOrder, permission: PERMISSION.ordersTake, load: asDefault(() => import('@/features/orders/NewOrderView'), 'NewOrderView') },
  { path: routePatterns.orderDetail, permission: PERMISSION.ordersTake, load: asDefault(() => import('@/features/orders/OrderDetailView'), 'OrderDetailView') },
  { path: routePatterns.addItems, permission: PERMISSION.ordersTake, load: asDefault(() => import('@/features/orders/AddItemsView'), 'AddItemsView') },
  {
    path: routePatterns.board,
    permission: PERMISSION.ordersReadAll,
    nav: { label: 'Tablero', icon: 'tablero', description: 'Los pedidos del día en vivo, de la cocina al cobro.' },
    load: asDefault(() => import('@/features/orders/BoardView'), 'BoardView'),
    prefetch: prefetchOf(() => import('@/features/orders/prefetchOrders'), 'prefetchBoard'),
  },
  { path: routePatterns.history, permission: PERMISSION.ordersReadAll, load: asDefault(() => import('@/features/orders/HistoryView'), 'HistoryView') },
  {
    path: routePatterns.kitchen,
    permission: PERMISSION.ordersTake,
    nav: {
      label: 'Cocina',
      icon: 'cocina',
      description: 'Lo que falta preparar, en tarjetas grandes para la pantalla de la cocina.',
    },
    load: asDefault(() => import('@/features/orders/KitchenView'), 'KitchenView'),
    prefetch: prefetchOf(() => import('@/features/orders/prefetchOrders'), 'prefetchKitchen'),
  },
  { path: routePatterns.print, permission: PERMISSION.ordersTake, load: asDefault(() => import('@/features/orders/PrintView'), 'PrintView') },
  {
    path: routePatterns.reservations,
    permission: PERMISSION.reservationsRead,
    nav: { label: 'Reservas', icon: 'reservas', description: 'Las reservas de cada día: a qué hora, cuántos y en qué mesa.' },
    load: asDefault(() => import('@/features/reservations/ReservationsView'), 'ReservationsView'),
  },
  {
    path: routePatterns.customers,
    permission: PERMISSION.customersRead,
    nav: { label: 'Clientes', icon: 'clientes', description: 'Los clientes frecuentes, sus datos de delivery y lo que gastan.' },
    load: asDefault(() => import('@/features/customers/CustomersView'), 'CustomersView'),
  },
  {
    path: routePatterns.cash,
    permission: PERMISSION.cashManage,
    nav: {
      label: 'Caja',
      icon: 'caja',
      description: 'Abrir y cerrar la caja del turno, con su arqueo y las propinas de cada mesero.',
    },
    load: asDefault(() => import('@/features/cash/CashView'), 'CashView'),
    prefetch: prefetchOf(() => import('@/features/cash/prefetchCash'), 'prefetchCash'),
  },
  {
    path: routePatterns.billing,
    permission: PERMISSION.billingManage,
    nav: {
      label: 'Comprobantes',
      icon: 'receta',
      description: 'Boletas y facturas electrónicas, los datos fiscales y lo que falta enviar a SUNAT.',
    },
    load: asDefault(() => import('@/features/billing/BillingView'), 'BillingView'),
  },
  { path: routePatterns.invoicePrint, permission: PERMISSION.billingIssue, load: asDefault(() => import('@/features/billing/InvoicePrintView'), 'InvoicePrintView') },
  {
    path: routePatterns.menu,
    permission: PERMISSION.menuManage,
    nav: { label: 'Menú', icon: 'carta', description: 'Categorías, platos, precios y lo que hay disponible hoy.' },
    load: asDefault(() => import('@/features/menu/MenuView'), 'MenuView'),
    prefetch: prefetchOf(() => import('@/features/menu/prefetchMenu'), 'prefetchMenu'),
  },
  {
    path: routePatterns.tables,
    permission: PERMISSION.tablesManage,
    nav: { label: 'Mesas', icon: 'mesa', description: 'Las mesas del salón y cuáles están en uso.' },
    load: asDefault(() => import('@/features/tables/TablesView'), 'TablesView'),
    prefetch: prefetchOf(() => import('@/features/tables/prefetchTables'), 'prefetchTables'),
  },
  {
    path: routePatterns.inventory,
    permission: PERMISSION.inventoryRead,
    nav: { label: 'Inventario', icon: 'inventario', description: 'Insumos, compras, mermas, recetas y alertas de stock bajo.' },
    load: asDefault(() => import('@/features/inventory/InventoryView'), 'InventoryView'),
    prefetch: prefetchOf(() => import('@/features/inventory/prefetchInventory'), 'prefetchInventory'),
  },
  { path: routePatterns.recipeEditor, permission: PERMISSION.inventoryRead, load: asDefault(() => import('@/features/inventory/RecipeEditorView'), 'RecipeEditorView') },
  {
    path: routePatterns.staff,
    permission: PERMISSION.staffManage,
    nav: { label: 'Personal', icon: 'personal', description: 'Las cuentas del restaurante y el rol de cada una.' },
    load: asDefault(() => import('@/features/staff/StaffView'), 'StaffView'),
    prefetch: prefetchOf(() => import('@/features/staff/prefetchStaff'), 'prefetchStaff'),
  },
  {
    path: routePatterns.roles,
    permission: PERMISSION.rolesManage,
    nav: {
      label: 'Roles',
      icon: 'roles',
      description: 'Qué puede hacer cada rol del restaurante: encargado, mesero y los que armes.',
    },
    load: asDefault(() => import('@/features/roles/RolesView'), 'RolesView'),
    prefetch: prefetchOf(() => import('@/features/roles/prefetchRoles'), 'prefetchRoles'),
  },
  {
    path: routePatterns.insights,
    permission: PERMISSION.insightsRead,
    nav: {
      label: 'Panel BI',
      icon: 'indicadores',
      description: 'Ventas, platos más vendidos, márgenes y la predicción de demanda.',
    },
    load: asDefault(() => import('@/features/insights/InsightsView'), 'InsightsView'),
    prefetch: prefetchOf(() => import('@/features/insights/prefetchInsights'), 'prefetchInsights'),
  },
  { path: routePatterns.restock, permission: PERMISSION.insightsRead, load: asDefault(() => import('@/features/insights/RestockView'), 'RestockView') },
  { path: routePatterns.aiAudit, permission: PERMISSION.insightsRead, load: asDefault(() => import('@/features/insights/AiAuditView'), 'AiAuditView') },
]
