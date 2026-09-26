import { describe, expect, it } from 'vitest'

import type { PermissionCode, Role } from '../../api/types'
import { roleAccess } from './roleAccess'

const CAJA: PermissionCode = 'cash.manage'
const COBRAR: PermissionCode = 'orders.charge'
const ROLES: PermissionCode = 'roles.manage'

const CAJERO: Role = {
  id: 5,
  name: 'Cajero',
  kind: 'custom',
  permissions: [CAJA, COBRAR],
  member_count: 1,
  is_editable: true,
  is_deletable: false,
}

describe('roleAccess', () => {
  it('el encargado no se cambia', () => {
    const encargado = { ...CAJERO, kind: 'owner' as const, is_editable: false }
    expect(roleAccess(encargado, [CAJA, COBRAR, ROLES])).toBe('fixed')
  })

  it('se edita si todos sus permisos están entre los propios', () => {
    expect(roleAccess(CAJERO, [CAJA, COBRAR, ROLES])).toBe('edit')
  })

  it('solo se mira si tiene un permiso que falta', () => {
    expect(roleAccess(CAJERO, [COBRAR, ROLES])).toBe('beyond')
  })
})
