import type { PermissionCode, PermissionInfo, Role, RoleKind } from '../../api/types'

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
const GRUPOS_EN_RESUMEN = 3

/** El catálogo por grupo, en el orden en que lo manda el servidor. */
export function groupPermissions(catalog: readonly PermissionInfo[]): PermissionGroup[] {
  const grupos = new Map<string, PermissionInfo[]>()
  for (const permiso of catalog) {
    const grupo = grupos.get(permiso.group)
    if (grupo === undefined) {
      grupos.set(permiso.group, [permiso])
    } else {
      grupo.push(permiso)
    }
  }
  return Array.from(grupos, ([name, permissions]) => ({ name, permissions }))
}

/** Marca o desmarca un permiso sin repetirlo. */
export function togglePermission(
  selected: readonly PermissionCode[],
  code: PermissionCode,
  checked: boolean,
): PermissionCode[] {
  const resto = selected.filter((actual) => actual !== code)
  return checked ? [...resto, code] : resto
}

function enumerar(nombres: readonly string[]): string {
  if (nombres.length <= 1) {
    return nombres.join('')
  }
  if (nombres.length > GRUPOS_EN_RESUMEN) {
    const extra = nombres.length - GRUPOS_EN_RESUMEN
    return `${nombres.slice(0, GRUPOS_EN_RESUMEN).join(', ')} y ${String(extra)} más`
  }
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1) ?? ''}`
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
  const cantidad = role.permissions.length
  if (cantidad === 0) {
    return 'Sin permisos'
  }
  const conteo = cantidad === 1 ? '1 permiso' : `${String(cantidad)} permisos`
  const nombres = groups
    .filter((grupo) => grupo.permissions.some((permiso) => role.permissions.includes(permiso.code)))
    .map((grupo) => grupo.name)
  return nombres.length === 0 ? conteo : `${conteo} · ${enumerar(nombres)}`
}

/** Cuántas personas tienen el rol. */
export function memberCountLabel(count: number): string {
  if (count === 0) {
    return 'Nadie lo tiene'
  }
  return count === 1 ? '1 persona' : `${String(count)} personas`
}
