import { describe, expect, it } from '@jest/globals'

import type { PermissionCode, Role } from '@/api/types'
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

const TAKE = 'orders.take'
const OWNER = role(1, 'owner', [TAKE, 'staff.manage', 'cash.manage'])
const WAITER = role(2, 'waiter', [TAKE])
const CASHIER = role(3, 'custom', ['cash.manage'])
const ROLES = [OWNER, WAITER, CASHIER]
const ONLY_STAFF: PermissionCode[] = [TAKE, 'staff.manage']

describe('roleOptions', () => {
  it('ofrece solo los roles que la cuenta puede dar', () => {
    expect(roleOptions(ROLES, ONLY_STAFF).map((option) => option.id)).toEqual([2])
  })

  it('al editar incluye el rol que la cuenta ya tiene', () => {
    expect(roleOptions(ROLES, ONLY_STAFF, 3).map((option) => option.id)).toEqual([2, 3])
  })
})

describe('defaultRoleId', () => {
  it('elige al mesero si está entre las opciones', () => {
    expect(defaultRoleId([CASHIER, WAITER])).toBe(2)
  })

  it('sin mesero elige la primera opción, y sin opciones ninguna', () => {
    expect(defaultRoleId([CASHIER])).toBe(3)
    expect(defaultRoleId([])).toBeUndefined()
  })
})

describe('canManageAccount', () => {
  it('no deja tocar una cuenta cuyo rol tiene permisos que faltan', () => {
    expect(canManageAccount({ role_id: 1 }, ROLES, ONLY_STAFF)).toBe(false)
    expect(canManageAccount({ role_id: 2 }, ROLES, ONLY_STAFF)).toBe(true)
  })

  it('sin la lista de roles deja decidir al servidor', () => {
    expect(canManageAccount({ role_id: 1 }, undefined, ONLY_STAFF)).toBe(true)
  })
})
