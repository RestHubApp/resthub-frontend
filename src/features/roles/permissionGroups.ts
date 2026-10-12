import type { PermissionCode, PermissionInfo, Role, RoleKind } from '@/api/types'

export interface PermissionGroup {
  readonly name: string
  readonly permissions: readonly PermissionInfo[]
}

/** Cómo se presenta cada clase de rol junto a su nombre. */
export const KIND_LABELS: Record<RoleKind, string> = {
  owner: 'Fijo',
  waiter: 'Base',
  custom: 'Personalizado',
}

// En el resumen de un rol se nombran a lo sumo estos grupos; el resto se cuenta.
const GROUPS_IN_SUMMARY = 3

/** El catálogo por grupo, en el orden en que lo manda el servidor. */
export function groupPermissions(catalog: readonly PermissionInfo[]): PermissionGroup[] {
  const groups = new Map<string, PermissionInfo[]>()
  for (const permission of catalog) {
    const group = groups.get(permission.group)
    if (group === undefined) {
      groups.set(permission.group, [permission])
    } else {
      group.push(permission)
    }
  }
  return Array.from(groups, ([name, permissions]) => ({ name, permissions }))
}

/** Marca o desmarca un permiso sin repetirlo. */
export function togglePermission(
  selected: readonly PermissionCode[],
  code: PermissionCode,
  checked: boolean,
): PermissionCode[] {
  const rest = selected.filter((actual) => actual !== code)
  return checked ? [...rest, code] : rest
}

function enumerate(names: readonly string[]): string {
  if (names.length <= 1) {
    return names.join('')
  }
  if (names.length > GROUPS_IN_SUMMARY) {
    const extra = names.length - GROUPS_IN_SUMMARY
    return `${names.slice(0, GROUPS_IN_SUMMARY).join(', ')} y ${String(extra)} más`
  }
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1) ?? ''}`
}

/**
 * Qué puede hacer un rol, en una línea: «4 permisos · Pedidos y Caja».
 *
 * Sin el catálogo todavía, solo cuenta los permisos.
 */
export function permissionSummary(
  role: Pick<Role, 'kind' | 'permissions'>,
  groups: readonly PermissionGroup[],
): string {
  if (role.kind === 'owner') {
    return 'Todos los permisos'
  }
  const quantity = role.permissions.length
  if (quantity === 0) {
    return 'Sin permisos'
  }
  const count = quantity === 1 ? '1 permiso' : `${String(quantity)} permisos`
  const owned = new Set(role.permissions)
  const names = groups
    .filter((group) => group.permissions.some((permission) => owned.has(permission.code)))
    .map((group) => group.name)
  return names.length === 0 ? count : `${count} · ${enumerate(names)}`
}

/** Cuántas personas tienen el rol. */
export function memberCountLabel(count: number): string {
  if (count === 0) {
    return 'Nadie lo tiene'
  }
  return count === 1 ? '1 persona' : `${String(count)} personas`
}
