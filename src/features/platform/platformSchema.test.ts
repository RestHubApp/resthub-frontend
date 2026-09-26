import { describe, expect, it } from 'vitest'

import type { PlatformRestaurantDetail } from '../../api/types'
import {
  createRestaurantPayload,
  createRestaurantSchema,
  ownerSchema,
  platformLoginSchema,
  restaurantSettingsSchema,
  settingsPayload,
} from './platformSchema'

const LIMA = 'America/Lima'
const ESQUINA = 'La Esquina'
const SLUG = 'la-esquina'
const BOGOTA = 'America/Bogota'
const CLAVE = 'x'.repeat(12)
const MARIA = 'María Quispe'
const OWNER = { full_name: MARIA, email: 'Maria@Correo.com ', password: CLAVE }
const ALTA = { name: `  ${ESQUINA}  `, slug: SLUG, timezone: LIMA, owner: OWNER }

const DETALLE: PlatformRestaurantDetail = {
  id: 3,
  name: ESQUINA,
  slug: SLUG,
  timezone: LIMA,
  is_active: true,
  created_at: '2026-09-01T12:00:00Z',
  staff_count: 2,
  active_staff_count: 2,
  owners: [],
}

function mensajes(resultado: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return resultado.error?.issues.map((issue) => issue.path.join('.')) ?? []
}

describe('createRestaurantSchema', () => {
  it('recorta el nombre, normaliza el correo y arma el cuerpo del contrato', () => {
    const valores = createRestaurantSchema.parse(ALTA)
    expect(createRestaurantPayload(valores)).toEqual({
      name: ESQUINA,
      slug: SLUG,
      timezone: LIMA,
      owner: { full_name: MARIA, email: 'maria@correo.com', password: CLAVE },
    })
  })

  it('rechaza un identificador mal formado y una zona que no existe', () => {
    const resultado = createRestaurantSchema.safeParse({ ...ALTA, slug: 'La Esquina', timezone: 'Lima' })
    expect(mensajes(resultado)).toEqual(expect.arrayContaining(['slug', 'timezone']))
  })

  it('pide la contraseña con la misma regla que el personal', () => {
    const resultado = createRestaurantSchema.safeParse({ ...ALTA, owner: { ...OWNER, password: 'x'.repeat(5) } })
    expect(mensajes(resultado)).toEqual(['owner.password'])
  })
})

describe('ownerSchema', () => {
  it('pide nombre con letras y un correo válido', () => {
    const resultado = ownerSchema.safeParse({ ...OWNER, full_name: 'María 2', email: 'maria' })
    expect(mensajes(resultado)).toEqual(expect.arrayContaining(['full_name', 'email']))
  })
})

describe('platformLoginSchema', () => {
  it('no exige el largo de la contraseña al entrar', () => {
    expect(platformLoginSchema.safeParse({ email: 'plataforma@resthub.dev', password: 'x' }).success).toBe(true)
    expect(mensajes(platformLoginSchema.safeParse({ email: 'plataforma@resthub.dev', password: '' }))).toEqual([
      'password',
    ])
  })
})

describe('settingsPayload', () => {
  it('manda solo lo que cambió', () => {
    expect(settingsPayload({ name: ESQUINA, timezone: LIMA }, DETALLE)).toEqual({})
    expect(settingsPayload({ name: 'La Esquina 2', timezone: LIMA }, DETALLE)).toEqual({ name: 'La Esquina 2' })
    expect(settingsPayload({ name: ESQUINA, timezone: BOGOTA }, DETALLE)).toEqual({
      timezone: BOGOTA,
    })
  })

  it('valida el nombre y la zona como el alta', () => {
    expect(mensajes(restaurantSettingsSchema.safeParse({ name: '  ', timezone: 'america/lima' }))).toEqual([
      'name',
      'timezone',
    ])
  })
})
