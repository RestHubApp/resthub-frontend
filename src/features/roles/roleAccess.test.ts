import { describe, expect, it } from '@jest/globals'

import type { PermissionCode, Role } from '@/api/types'
import { roleAccess } from './roleAccess'

const CASH_REGISTER: PermissionCode = 'cash.manage'
const CHARGE: PermissionCode = 'orders.charge'
const ROLES: PermissionCode = 'roles.manage'

const CASHIER: Role = {
  id: 5,
  name: 'Cajero',
  kind: 'custom',
  permissions: [CASH_REGISTER, CHARGE],
  member_count: 1,
  is_editable: true,
  is_deletable: false,
}

describe('roleAccess', () => {
  it('el encargado no se cambia', () => {
    const owner = { ...CASHIER, kind: 'owner' as const, is_editable: false }
    expect(roleAccess(owner, [CASH_REGISTER, CHARGE, ROLES])).toBe('fixed')
  })

  it('se edita si todos sus permisos están entre los propios', () => {
    expect(roleAccess(CASHIER, [CASH_REGISTER, CHARGE, ROLES])).toBe('edit')
  })

  it('solo se mira si tiene un permiso que falta', () => {
    expect(roleAccess(CASHIER, [CHARGE, ROLES])).toBe('beyond')
  })
})
