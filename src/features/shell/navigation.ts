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
    description: 'Los pedidos del día en vivo, de la cocina a la caja, y el cobro.',
    permission: 'orders.read_all',
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
    description: 'Las cuentas de meseros y encargados del restaurante.',
    permission: 'staff.manage',
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
