import { describe, expect, it } from 'vitest'

import type { PermissionCode, PermissionInfo } from '../../api/types'
import { groupPermissions, memberCountLabel, permissionSummary, togglePermission } from './permissionGroups'

const PEDIDOS = 'Pedidos'
const TOMAR: PermissionCode = 'orders.take'
const COBRAR: PermissionCode = 'orders.charge'
const CAJA: PermissionCode = 'cash.manage'

function permiso(code: PermissionCode, group: string): PermissionInfo {
  return { code, label: code, group }
}

const CATALOGO: PermissionInfo[] = [
  permiso(TOMAR, PEDIDOS),
  permiso(COBRAR, PEDIDOS),
  permiso(CAJA, 'Caja'),
  permiso('menu.manage', 'Menú'),
  permiso('tables.manage', 'Mesas'),
  permiso('roles.manage', 'Administración'),
]
const GRUPOS = groupPermissions(CATALOGO)

describe('groupPermissions', () => {
  it('agrupa en el orden del catálogo', () => {
    expect(GRUPOS.map((grupo) => grupo.name)).toEqual([PEDIDOS, 'Caja', 'Menú', 'Mesas', 'Administración'])
    expect(GRUPOS[0]?.permissions.map((actual) => actual.code)).toEqual([TOMAR, COBRAR])
  })

  it('junta un grupo aunque sus permisos no vengan seguidos', () => {
    const grupos = groupPermissions([permiso(TOMAR, PEDIDOS), permiso(CAJA, 'Caja'), permiso(COBRAR, PEDIDOS)])
    expect(grupos.map((grupo) => grupo.permissions.length)).toEqual([2, 1])
  })
})

describe('togglePermission', () => {
  it('marca sin repetir y desmarca', () => {
    expect(togglePermission([TOMAR], TOMAR, true)).toEqual([TOMAR])
    expect(togglePermission([TOMAR], CAJA, true)).toEqual([TOMAR, CAJA])
    expect(togglePermission([TOMAR, CAJA], TOMAR, false)).toEqual([CAJA])
  })
})

describe('permissionSummary', () => {
  it('el encargado tiene todo', () => {
    expect(permissionSummary({ kind: 'owner', permissions: [] }, GRUPOS)).toBe('Todos los permisos')
  })

  it('cuenta los permisos y nombra sus grupos', () => {
    expect(permissionSummary({ kind: 'waiter', permissions: [TOMAR] }, GRUPOS)).toBe('1 permiso · Pedidos')
    expect(permissionSummary({ kind: 'custom', permissions: [TOMAR, COBRAR, CAJA] }, GRUPOS)).toBe(
      '3 permisos · Pedidos y Caja',
    )
  })

  it('con muchos grupos nombra tres y cuenta el resto', () => {
    const todos = CATALOGO.map((actual) => actual.code)
    expect(permissionSummary({ kind: 'custom', permissions: todos }, GRUPOS)).toBe(
      '6 permisos · Pedidos, Caja, Menú y 2 más',
    )
  })

  it('sin permisos o sin catálogo', () => {
    expect(permissionSummary({ kind: 'custom', permissions: [] }, GRUPOS)).toBe('Sin permisos')
    expect(permissionSummary({ kind: 'custom', permissions: [CAJA] }, [])).toBe('1 permiso')
  })
})

describe('memberCountLabel', () => {
  it('en singular, plural o nadie', () => {
    expect(memberCountLabel(0)).toBe('Nadie lo tiene')
    expect(memberCountLabel(1)).toBe('1 persona')
    expect(memberCountLabel(4)).toBe('4 personas')
  })
})
