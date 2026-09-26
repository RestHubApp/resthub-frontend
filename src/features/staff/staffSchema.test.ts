import { describe, expect, it } from 'vitest'

import { createPayload, createStaffSchema, emptyCreateStaff, identityPayload } from './staffSchema'

const ALTA = {
  full_name: 'María Quispe',
  email: 'maria@correo.com',
  role_id: '4',
  password: 'x'.repeat(12),
}

describe('createStaffSchema', () => {
  it('pide elegir un rol', () => {
    const resultado = createStaffSchema.safeParse({ ...ALTA, role_id: '' })
    expect(resultado.success).toBe(false)
    expect(resultado.error?.issues[0]?.message).toBe('Elige el rol')
  })

  it('acepta un alta completa', () => {
    expect(createStaffSchema.safeParse(ALTA).success).toBe(true)
  })
})

describe('emptyCreateStaff', () => {
  it('viene con el rol elegido, si lo hay', () => {
    expect(emptyCreateStaff(2).role_id).toBe('2')
    expect(emptyCreateStaff(undefined).role_id).toBe('')
  })
})

describe('payloads', () => {
  it('el alta manda el rol como número', () => {
    expect(createPayload(ALTA)).toEqual({ ...ALTA, role_id: 4 })
  })

  it('la edición manda el rol como número', () => {
    expect(identityPayload({ full_name: 'Ana', role_id: '1' })).toEqual({ full_name: 'Ana', role_id: 1 })
  })
})
