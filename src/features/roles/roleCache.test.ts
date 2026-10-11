import { describe, expect, it } from '@jest/globals'

import type { Role } from '@/api/types'
import { withRole } from './roleCache'

function role(id: number, kind: Role['kind'], name: string): Role {
  return { id, name, kind, permissions: [], member_count: 0, is_editable: true, is_deletable: false }
}

const LIST = [role(1, 'owner', 'Encargado'), role(2, 'waiter', 'Mesero'), role(4, 'custom', 'Cocina')]

describe('withRole', () => {
  it('un rol nuevo entra entre los personalizados por nombre', () => {
    expect(withRole(LIST, role(5, 'custom', 'Cajero')).map((actual) => actual.id)).toEqual([1, 2, 5, 4])
    expect(withRole(LIST, role(6, 'custom', 'delivery')).map((actual) => actual.id)).toEqual([1, 2, 4, 6])
  })

  it('renombrado cambia de lugar; con el mismo nombre queda donde estaba', () => {
    expect(withRole(LIST, role(4, 'custom', 'Almacén')).map((actual) => actual.id)).toEqual([1, 2, 4])
    const waiter = { ...role(2, 'waiter', 'Mesero'), member_count: 7 }
    expect(withRole(LIST, waiter)[1]?.member_count).toBe(7)
  })

  it('un rol owner o waiter se ubica según la prioridad de tipo', () => {
    const withoutOwner = [role(2, 'waiter', 'Mesero'), role(4, 'custom', 'Cocina')]
    const withOwner = withRole(withoutOwner, role(1, 'owner', 'Administrador'))
    expect(withOwner[0]?.kind).toBe('owner')

    const withoutWaiter = [role(1, 'owner', 'Encargado'), role(4, 'custom', 'Cocina')]
    const withWaiter = withRole(withoutWaiter, role(2, 'waiter', 'Atención'))
    expect(withWaiter[1]?.kind).toBe('waiter')
  })
})
