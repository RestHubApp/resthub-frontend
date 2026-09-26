import { describe, expect, it } from 'vitest'

import type { PermissionCode, Role } from '../../api/types'
import { MAX_ROLE_NAME, rolePayload, roleSchema, valuesOf } from './roleSchema'

const CAJA: PermissionCode = 'cash.manage'

const MESERO: Role = {
  id: 2,
  name: 'Mesero',
  kind: 'waiter',
  permissions: ['orders.take'],
  member_count: 3,
  is_editable: true,
  is_deletable: false,
}

describe('roleSchema', () => {
  it('pide un nombre de hasta 40 caracteres', () => {
    expect(roleSchema.safeParse({ name: '  ', permissions: [] }).success).toBe(false)
    expect(roleSchema.safeParse({ name: 'x'.repeat(MAX_ROLE_NAME + 1), permissions: [] }).success).toBe(false)
    expect(roleSchema.safeParse({ name: ' Cajero ', permissions: [CAJA] }).data?.name).toBe('Cajero')
  })
})

describe('valuesOf', () => {
  it('un rol nuevo empieza vacío; uno existente, con lo suyo', () => {
    expect(valuesOf(null)).toEqual({ name: '', permissions: [] })
    expect(valuesOf(MESERO)).toEqual({ name: 'Mesero', permissions: ['orders.take'] })
  })
})

describe('rolePayload', () => {
  it('el mesero manda su nombre tal cual', () => {
    expect(rolePayload({ name: 'Mozo', permissions: [] }, MESERO)).toEqual({ name: 'Mesero', permissions: [] })
  })

  it('un rol personalizado manda el nombre escrito', () => {
    const cajero = { ...MESERO, id: 5, kind: 'custom' as const, name: 'Caja' }
    expect(rolePayload({ name: 'Cajero', permissions: [CAJA] }, cajero)).toEqual({
      name: 'Cajero',
      permissions: [CAJA],
    })
    expect(rolePayload({ name: 'Cocina', permissions: [] }, null).name).toBe('Cocina')
  })
})
