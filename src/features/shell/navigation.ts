import type { AnyPermissionCode } from '@/api/types'
import type { ScreenNav, ShellScreen } from './shellScreens'

/** Una entrada del menú: la pantalla, su ruta y el permiso que la muestra. */
export interface NavEntry extends ScreenNav {
  readonly to: string
  /** El mismo permiso que exige la ruta. */
  readonly permission: AnyPermissionCode
}

/**
 * Las entradas del menú, en el orden del registro de pantallas.
 *
 * El registro (`src/router/screens.ts`) es la única fuente: cada pantalla con
 * `nav` y `permission` es una entrada, y el orden es el de uso: lo primero es
 * lo que el mesero abre cien veces por turno, y las primeras cuatro son las
 * que caben en la barra inferior del celular.
 */
function allEntries(screens: readonly ShellScreen[]): readonly NavEntry[] {
  return screens.flatMap(({ path, permission, nav }) =>
    nav === undefined || permission === undefined ? [] : [{ ...nav, to: path, permission }],
  )
}

export function entriesFor(
  screens: readonly ShellScreen[],
  permissions: readonly AnyPermissionCode[],
): readonly NavEntry[] {
  const granted = new Set(permissions)
  return allEntries(screens).filter((entry) => granted.has(entry.permission))
}

export function entryFor(screens: readonly ShellScreen[], pathname: string): NavEntry | undefined {
  return allEntries(screens).find((entry) => entry.to === pathname)
}

/** Si la entrada es la pantalla de `pathname` (o una de las que cuelgan de ella). */
export function isCurrentEntry(entry: NavEntry, pathname: string): boolean {
  if (pathname === entry.to) {
    return true
  }
  if (entry.activeOn !== undefined) {
    return entry.activeOn.some((prefix) => pathname.startsWith(prefix))
  }
  return pathname.startsWith(`${entry.to}/`)
}
