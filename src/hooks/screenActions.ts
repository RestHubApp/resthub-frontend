import { PERMISSION } from '@/api/permissions'
import type { PermissionCode } from '@/api/types'
import { routePatterns } from '@/services/paths'

/**
 * Los diálogos de acción frecuente que una dirección puede abrir con
 * `?accion=<id>`, y la única lista de ellos.
 *
 * Es una lista cerrada: cada pantalla escucha solo los ids que declara acá
 * (`useScreenAction`), y un valor que no está se ignora. El parámetro nunca
 * ejecuta nada ni trae datos: abre un diálogo vacío, el mismo del botón, y se
 * borra de la dirección al abrirse. El permiso de cada entrada es el que ya
 * exige el botón o la ruta; sirve a quien arme una lista de accesos (la paleta
 * de comandos) para ofrecer solo lo que la cuenta puede hacer. Ocultar no es
 * seguridad: el servidor vuelve a comprobarlo.
 */
export const SCREEN_ACTIONS = [
  { id: 'abrir-caja', screen: routePatterns.cash, label: 'Abrir caja', permission: PERMISSION.cashManage },
  { id: 'datos-fiscales', screen: routePatterns.billing, label: 'Datos fiscales', permission: PERMISSION.billingManage },
  { id: 'reglas-de-stock', screen: routePatterns.inventory, label: 'Reglas de stock', permission: PERMISSION.inventoryManage },
  { id: 'nuevo-plato', screen: routePatterns.menu, label: 'Nuevo plato', permission: PERMISSION.menuManage },
  { id: 'nueva-categoria', screen: routePatterns.menu, label: 'Nueva categoría', permission: PERMISSION.menuManage },
  { id: 'nueva-mesa', screen: routePatterns.tables, label: 'Nueva mesa', permission: PERMISSION.tablesManage },
  { id: 'nuevo-rol', screen: routePatterns.roles, label: 'Nuevo rol', permission: PERMISSION.rolesManage },
  { id: 'cambiar-contrasena', screen: routePatterns.profile, label: 'Cambiar contraseña', permission: undefined },
] as const satisfies readonly {
  readonly id: string
  readonly screen: string
  readonly label: string
  /** Sin permiso: cualquier cuenta con sesión (la contraseña es de cada quien). */
  readonly permission: PermissionCode | undefined
}[]

export type ScreenActionId = (typeof SCREEN_ACTIONS)[number]['id']

/** El nombre del parámetro de la dirección. */
export const ACTION_PARAM = 'accion'
