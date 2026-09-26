import type { Role, RoleKind } from '../../api/types'
import { upsertInList } from '../../services/cacheList'

// El mismo orden que el servidor: encargado, mesero y los demás por nombre.
const KIND_ORDER: Record<RoleKind, number> = { owner: 0, waiter: 1, custom: 2 }

function before(role: Role, other: Role): boolean {
  const porClase = KIND_ORDER[role.kind] - KIND_ORDER[other.kind]
  return porClase === 0 ? role.name.localeCompare(other.name, 'es', { sensitivity: 'base' }) < 0 : porClase < 0
}

/** Los roles con el que devolvió el servidor, en su lugar. */
export function withRole(roles: readonly Role[], role: Role): Role[] {
  return upsertInList(roles, role, before, (previo) => previo.name === role.name)
}
