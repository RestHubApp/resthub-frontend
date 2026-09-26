import { describe, expect, it } from 'vitest'

import type { Role } from '../../api/types'
import { withRole } from './roleCache'

function role(id: number, kind: Role['kind'], name: string): Role {
  return { id, name, kind, permissions: [], member_count: 0, is_editable: true, is_deletable: false }
}

const LISTA = [role(1, 'owner', 'Encargado'), role(2, 'waiter', 'Mesero'), role(4, 'custom', 'Cocina')]

describe('withRole', () => {
  it('un rol nuevo entra entre los personalizados por nombre', () => {
    expect(withRole(LISTA, role(5, 'custom', 'Cajero')).map((actual) => actual.id)).toEqual([1, 2, 5, 4])
    expect(withRole(LISTA, role(6, 'custom', 'delivery')).map((actual) => actual.id)).toEqual([1, 2, 4, 6])
  })

  it('renombrado cambia de lugar; con el mismo nombre queda donde estaba', () => {
    expect(withRole(LISTA, role(4, 'custom', 'Almacén')).map((actual) => actual.id)).toEqual([1, 2, 4])
    const mesero = { ...role(2, 'waiter', 'Mesero'), member_count: 7 }
    expect(withRole(LISTA, mesero)[1]?.member_count).toBe(7)
  })
})
