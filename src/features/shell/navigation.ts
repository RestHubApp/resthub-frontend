import type { PermissionCode } from '@/api/types'
import type { ScreenNav, ShellScreen } from './shellScreens'

/** Una entrada del menú: la pantalla, su ruta y el permiso que la muestra. */
export interface NavEntry extends ScreenNav {
  readonly to: string
  /** El mismo permiso que exige la ruta. */
  readonly permission: PermissionCode
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
  permissions: readonly PermissionCode[],
): readonly NavEntry[] {
  return allEntries(screens).filter((entry) => permissions.includes(entry.permission))
}

export function entryFor(screens: readonly ShellScreen[], pathname: string): NavEntry | undefined {
  return allEntries(screens).find((entry) => entry.to === pathname)
}
