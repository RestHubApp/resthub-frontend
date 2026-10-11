import type { PermissionCode, PlatformPermissionCode } from '@/api/types'

/**
 * Los permisos que la interfaz pregunta, con nombre.
 *
 * Los valores los define el backend (`PermissionCode` sale del contrato), asi
 * que un valor que ya no exista deja de compilar. Aqui solo se les pone nombre:
 * `useCan(PERMISSION.ordersCharge)` en vez de un literal suelto, que ESLint
 * prohibe fuera de este archivo.
 */
export const PERMISSION = {
  billingIssue: 'billing.issue',
  billingManage: 'billing.manage',
  cashManage: 'cash.manage',
  customersErase: 'customers.erase',
  customersManage: 'customers.manage',
  customersRead: 'customers.read',
  insightsRead: 'insights.read',
  inventoryManage: 'inventory.manage',
  inventoryRead: 'inventory.read',
  menuManage: 'menu.manage',
  menuRead: 'menu.read',
  ordersCharge: 'orders.charge',
  ordersDiscountAny: 'orders.discount_any',
  ordersManage: 'orders.manage',
  ordersReadAll: 'orders.read_all',
  ordersTake: 'orders.take',
  reservationsManage: 'reservations.manage',
  reservationsRead: 'reservations.read',
  restaurantManage: 'restaurant.manage',
  rolesManage: 'roles.manage',
  staffManage: 'staff.manage',
  tablesManage: 'tables.manage',
  tablesRead: 'tables.read',
} as const satisfies Record<string, PermissionCode>

/**
 * Los permisos de la administración del sistema (`platform.*`), con nombre.
 *
 * Son un catálogo aparte del de un restaurante: un encargado nunca los recibe.
 * Las pantallas de plataforma los piden igual que las demás piden los suyos.
 */
export const PLATFORM_PERMISSION = {
  restaurantsRead: 'platform.restaurants.read',
  restaurantsManage: 'platform.restaurants.manage',
  activityRead: 'platform.activity.read',
  previewOpen: 'platform.preview.open',
  observabilityRead: 'platform.observability.read',
} as const satisfies Record<string, PlatformPermissionCode>
