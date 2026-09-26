import type { IconName } from '../../components/icons'
import type { PermissionCode } from '../../api/types'

export interface NavEntry {
  readonly to: string
  readonly label: string
  readonly icon: IconName
  /** Para que sirve la pantalla. Lo muestra el aviso de "Próximamente". */
  readonly description: string
  /** Permiso que la muestra. El mismo que exige la ruta. */
  readonly permission: PermissionCode
}

/**
 * Menu de la aplicacion, en un solo lugar.
 *
 * Cada entrada declara el permiso que la muestra, asi que agregar una pantalla
 * es agregar una linea aca y su ruta. El orden es el de uso: lo primero es lo
 * que el mesero abre cien veces por turno, y las primeras cuatro son las que
 * caben en la barra inferior del celular.
 */
export const NAV_ENTRIES: readonly NavEntry[] = [
  {
    to: '/pedidos',
    label: 'Pedidos',
    icon: 'pedido',
    description: 'Tomar pedidos por mesa o para llevar, enviarlos a cocina y marcarlos servidos.',
    permission: 'orders.take',
  },
  {
    to: '/tablero',
    label: 'Tablero',
    icon: 'tablero',
    description: 'Los pedidos del día en vivo, de la cocina al cobro.',
    permission: 'orders.read_all',
  },
  {
    to: '/cocina',
    label: 'Cocina',
    icon: 'cocina',
    description: 'Lo que falta preparar, en tarjetas grandes para la pantalla de la cocina.',
    permission: 'orders.take',
  },
  {
    to: '/reservas',
    label: 'Reservas',
    icon: 'reservas',
    description: 'Las reservas de cada día: a qué hora, cuántos y en qué mesa.',
    permission: 'reservations.read',
  },
  {
    to: '/clientes',
    label: 'Clientes',
    icon: 'clientes',
    description: 'Los clientes frecuentes, sus datos de delivery y lo que gastan.',
    permission: 'customers.read',
  },
  {
    to: '/caja',
    label: 'Caja',
    icon: 'caja',
    description: 'Abrir y cerrar la caja del turno, con su arqueo y las propinas de cada mesero.',
    permission: 'cash.manage',
  },
  {
    to: '/comprobantes',
    label: 'Comprobantes',
    icon: 'receta',
    description: 'Boletas y facturas electrónicas, los datos fiscales y lo que falta enviar a SUNAT.',
    permission: 'billing.manage',
  },
  {
    to: '/menu',
    label: 'Menú',
    icon: 'carta',
    description: 'Categorías, platos, precios y lo que hay disponible hoy.',
    permission: 'menu.manage',
  },
  {
    to: '/mesas',
    label: 'Mesas',
    icon: 'mesa',
    description: 'Las mesas del salón y cuáles están en uso.',
    permission: 'tables.manage',
  },
  {
    to: '/inventario',
    label: 'Inventario',
    icon: 'inventario',
    description: 'Insumos, compras, mermas, recetas y alertas de stock bajo.',
    permission: 'inventory.read',
  },
  {
    to: '/personal',
    label: 'Personal',
    icon: 'personal',
    description: 'Las cuentas del restaurante y el rol de cada una.',
    permission: 'staff.manage',
  },
  {
    to: '/roles',
    label: 'Roles',
    icon: 'roles',
    description: 'Qué puede hacer cada rol del restaurante: encargado, mesero y los que armes.',
    permission: 'roles.manage',
  },
  {
    to: '/panel',
    label: 'Panel BI',
    icon: 'indicadores',
    description: 'Ventas, platos más vendidos, márgenes y la predicción de demanda.',
    permission: 'insights.read',
  },
]

export function entriesFor(permissions: readonly PermissionCode[]): readonly NavEntry[] {
  return NAV_ENTRIES.filter((entry) => permissions.includes(entry.permission))
}

export function entryFor(pathname: string): NavEntry | undefined {
  return NAV_ENTRIES.find((entry) => entry.to === pathname)
}
