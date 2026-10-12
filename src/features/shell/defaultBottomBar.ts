import { PERMISSION } from '@/api/permissions'
import { BOTTOM_BAR_SLOTS } from '@/services/appearanceRules'
import { routePatterns } from '@/services/paths'
import type { NavEntry } from './navigation'

/**
 * La barra de abajo de fábrica: lo que cada tipo de trabajo más toca.
 *
 * No se pregunta por el nombre del rol (cada local arma los suyos) sino por lo
 * que la cuenta puede abrir: el primer perfil cuyo permiso distintivo está entre
 * sus entradas pone sus pantallas primero, y lo que falte se completa con el
 * orden del menú. Una pantalla que la cuenta no puede abrir nunca entra: aquí
 * solo se ordena lo que `entriesFor` ya dejó pasar.
 */
interface BarProfile {
  /** El permiso de una entrada del menú que distingue este trabajo. */
  readonly signature: (permissions: ReadonlySet<string>) => boolean
  /** Las pantallas que más toca, de la más a la menos usada. */
  readonly screens: readonly string[]
}

const PLATFORM_PREFIX = 'platform.'

const PROFILES: readonly BarProfile[] = [
  {
    // La administración del sistema.
    signature: (permissions) => [...permissions].some((permission) => permission.startsWith(PLATFORM_PREFIX)),
    screens: [routePatterns.platform, routePatterns.platformPreview, routePatterns.observability, routePatterns.activity],
  },
  {
    // Quien lleva el local: pedidos, tablero, caja y resumen.
    signature: (permissions) => permissions.has(PERMISSION.cashManage) || permissions.has(PERMISSION.insightsRead),
    screens: [routePatterns.orders, routePatterns.board, routePatterns.cash, routePatterns.insights],
  },
  {
    // Quien ve todos los pedidos sin llevar el local: la cocina y su stock.
    signature: (permissions) => permissions.has(PERMISSION.ordersReadAll),
    screens: [routePatterns.board, routePatterns.kitchen, routePatterns.inventory, routePatterns.orders],
  },
  {
    // Quien toma pedidos en el salón.
    signature: (permissions) => permissions.has(PERMISSION.ordersTake),
    screens: [routePatterns.orders, routePatterns.kitchen, routePatterns.reservations, routePatterns.customers],
  },
]

/** Las rutas de la barra de abajo de fábrica para estas entradas (ya filtradas por permisos y ordenadas). */
export function defaultBottomPaths(entries: readonly NavEntry[]): readonly string[] {
  const permissions = new Set<string>(entries.map((entry) => entry.permission))
  const available = new Set(entries.map((entry) => entry.to))
  const preferred = PROFILES.find((profile) => profile.signature(permissions))?.screens.filter((path) => available.has(path)) ?? []
  const chosen = new Set(preferred)
  const rest = entries.map((entry) => entry.to).filter((path) => !chosen.has(path))
  return [...preferred, ...rest].slice(0, BOTTOM_BAR_SLOTS)
}
