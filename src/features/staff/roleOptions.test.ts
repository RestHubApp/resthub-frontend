import { describe, expect, it } from 'vitest'

import type { PermissionCode, Role } from '../../api/types'
import { canManageAccount, defaultRoleId, roleOptions } from './roleOptions'

function role(id: number, kind: Role['kind'], permissions: PermissionCode[]): Role {
  return {
    id,
    name: `Rol ${String(id)}`,
    kind,
    permissions,
    member_count: 0,
    is_editable: kind !== 'owner',
    is_deletable: kind === 'custom',
  }
}

const TOMAR = 'orders.take'
const ENCARGADO = role(1, 'owner', [TOMAR, 'staff.manage', 'cash.manage'])
const MESERO = role(2, 'waiter', [TOMAR])
const CAJERO = role(3, 'custom', ['cash.manage'])
const ROLES = [ENCARGADO, MESERO, CAJERO]
const SOLO_PERSONAL: PermissionCode[] = [TOMAR, 'staff.manage']

describe('roleOptions', () => {
  it('ofrece solo los roles que la cuenta puede dar', () => {
    expect(roleOptions(ROLES, SOLO_PERSONAL).map((opcion) => opcion.id)).toEqual([2])
  })

  it('al editar incluye el rol que la cuenta ya tiene', () => {
    expect(roleOptions(ROLES, SOLO_PERSONAL, 3).map((opcion) => opcion.id)).toEqual([2, 3])
  })
})

describe('defaultRoleId', () => {
  it('elige al mesero si está entre las opciones', () => {
    expect(defaultRoleId([CAJERO, MESERO])).toBe(2)
  })

  it('sin mesero elige la primera opción, y sin opciones ninguna', () => {
    expect(defaultRoleId([CAJERO])).toBe(3)
    expect(defaultRoleId([])).toBeUndefined()
  })
})

describe('canManageAccount', () => {
  it('no deja tocar una cuenta cuyo rol tiene permisos que faltan', () => {
    expect(canManageAccount({ role_id: 1 }, ROLES, SOLO_PERSONAL)).toBe(false)
    expect(canManageAccount({ role_id: 2 }, ROLES, SOLO_PERSONAL)).toBe(true)
  })

  it('sin la lista de roles deja decidir al servidor', () => {
    expect(canManageAccount({ role_id: 1 }, undefined, SOLO_PERSONAL)).toBe(true)
  })
})
