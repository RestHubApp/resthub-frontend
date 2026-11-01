import { ACCESS_SCREENS } from './screens/accessScreens'
import { ADMIN_SCREENS } from './screens/adminScreens'
import { AUDIT_SCREENS } from './screens/auditScreens'
import { BOARD_SCREENS } from './screens/boardScreens'
import { CATALOG_SCREENS } from './screens/catalogScreens'
import { INSIGHTS_SCREENS } from './screens/insightsScreens'
import { INVENTORY_SCREENS } from './screens/inventoryScreens'
import { ORDERS_SCREENS } from './screens/ordersScreens'
import { PLATFORM_SCREENS } from './screens/platformScreens'
import { SALES_SCREENS } from './screens/salesScreens'
import type { Screen } from './screens/screenTypes'

/**
 * Las pantallas de la aplicación, en un solo lugar: las del restaurante y las de
 * la administración del sistema (`/plataforma/...`, con permisos `platform.*`).
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
  ...ACCESS_SCREENS,
  ...ORDERS_SCREENS,
  ...BOARD_SCREENS,
  ...SALES_SCREENS,
  ...CATALOG_SCREENS,
  ...INVENTORY_SCREENS,
  ...ADMIN_SCREENS,
  ...INSIGHTS_SCREENS,
  ...AUDIT_SCREENS,
  ...PLATFORM_SCREENS,
]
