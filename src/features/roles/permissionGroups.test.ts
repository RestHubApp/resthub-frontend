import { describe, expect, it } from '@jest/globals'

import type { PermissionCode, PermissionInfo } from '@/api/types'
import { groupPermissions, memberCountLabel, permissionSummary, togglePermission } from './permissionGroups'

const ORDERS = 'Pedidos'
const TAKE: PermissionCode = 'orders.take'
const CHARGE: PermissionCode = 'orders.charge'
const CASH_REGISTER: PermissionCode = 'cash.manage'

function permission(code: PermissionCode, group: string): PermissionInfo {
  return { code, label: code, group }
}

const CATALOG: PermissionInfo[] = [
  permission(TAKE, ORDERS),
  permission(CHARGE, ORDERS),
  permission(CASH_REGISTER, 'Caja'),
  permission('menu.manage', 'Menú'),
  permission('tables.manage', 'Mesas'),
  permission('roles.manage', 'Administración'),
]
const GROUPS = groupPermissions(CATALOG)

describe('groupPermissions', () => {
  it('agrupa en el orden del catálogo', () => {
    expect(GROUPS.map((group) => group.name)).toEqual([ORDERS, 'Caja', 'Menú', 'Mesas', 'Administración'])
    expect(GROUPS[0]?.permissions.map((actual) => actual.code)).toEqual([TAKE, CHARGE])
  })

  it('junta un grupo aunque sus permisos no vengan seguidos', () => {
    const groups = groupPermissions([permission(TAKE, ORDERS), permission(CASH_REGISTER, 'Caja'), permission(CHARGE, ORDERS)])
    expect(groups.map((group) => group.permissions.length)).toEqual([2, 1])
  })
})

describe('togglePermission', () => {
  it('marca sin repetir y desmarca', () => {
    expect(togglePermission([TAKE], TAKE, true)).toEqual([TAKE])
    expect(togglePermission([TAKE], CASH_REGISTER, true)).toEqual([TAKE, CASH_REGISTER])
    expect(togglePermission([TAKE, CASH_REGISTER], TAKE, false)).toEqual([CASH_REGISTER])
  })
})

describe('permissionSummary', () => {
  it('el encargado tiene todo', () => {
    expect(permissionSummary({ kind: 'owner', permissions: [] }, GROUPS)).toBe('Todos los permisos')
  })

  it('cuenta los permisos y nombra sus grupos', () => {
    expect(permissionSummary({ kind: 'waiter', permissions: [TAKE] }, GROUPS)).toBe('1 permiso · Pedidos')
    expect(permissionSummary({ kind: 'custom', permissions: [TAKE, CHARGE, CASH_REGISTER] }, GROUPS)).toBe(
      '3 permisos · Pedidos y Caja',
    )
  })

  it('con muchos grupos nombra tres y cuenta el resto', () => {
    const all = CATALOG.map((actual) => actual.code)
    expect(permissionSummary({ kind: 'custom', permissions: all }, GROUPS)).toBe(
      '6 permisos · Pedidos, Caja, Menú y 2 más',
    )
  })

  it('sin permisos o sin catálogo', () => {
    expect(permissionSummary({ kind: 'custom', permissions: [] }, GROUPS)).toBe('Sin permisos')
    expect(permissionSummary({ kind: 'custom', permissions: [CASH_REGISTER] }, [])).toBe('1 permiso')
  })
})

describe('memberCountLabel', () => {
  it('en singular, plural o nadie', () => {
    expect(memberCountLabel(0)).toBe('Nadie lo tiene')
    expect(memberCountLabel(1)).toBe('1 persona')
    expect(memberCountLabel(4)).toBe('4 personas')
  })
})
