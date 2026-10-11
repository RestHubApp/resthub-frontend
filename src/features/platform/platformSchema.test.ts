import { describe, expect, it } from '@jest/globals'

import type { PlatformRestaurantDetail } from '@/api/types'
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
const PASSWORD = 'x'.repeat(12)
const MARIA = 'María Quispe'
const OWNER = { full_name: MARIA, email: 'Maria@Correo.com ', password: PASSWORD }
const REGISTRATION = { name: `  ${ESQUINA}  `, slug: SLUG, timezone: LIMA, owner: OWNER }

const DETAIL: PlatformRestaurantDetail = {
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

function messages(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? []
}

describe('createRestaurantSchema', () => {
  it('recorta el nombre, normaliza el correo y arma el cuerpo del contrato', () => {
    const values = createRestaurantSchema.parse(REGISTRATION)
    expect(createRestaurantPayload(values)).toEqual({
      name: ESQUINA,
      slug: SLUG,
      timezone: LIMA,
      owner: { full_name: MARIA, email: 'maria@correo.com', password: PASSWORD },
    })
  })

  it('rechaza un identificador mal formado y una zona que no existe', () => {
    const result = createRestaurantSchema.safeParse({ ...REGISTRATION, slug: 'La Esquina', timezone: 'Lima' })
    expect(messages(result)).toEqual(expect.arrayContaining(['slug', 'timezone']))
  })

  it('pide la contraseña con la misma regla que el personal', () => {
    const result = createRestaurantSchema.safeParse({ ...REGISTRATION, owner: { ...OWNER, password: 'x'.repeat(5) } })
    expect(messages(result)).toEqual(['owner.password'])
  })
})

describe('ownerSchema', () => {
  it('pide nombre con letras y un correo válido', () => {
    const result = ownerSchema.safeParse({ ...OWNER, full_name: 'María 2', email: 'maria' })
    expect(messages(result)).toEqual(expect.arrayContaining(['full_name', 'email']))
  })
})

describe('platformLoginSchema', () => {
  const email = 'plataforma@resthub.dev'

  it('no exige el mínimo de la contraseña al entrar', () => {
    expect(platformLoginSchema.safeParse({ email: email, password: 'x' }).success).toBe(true)
    expect(messages(platformLoginSchema.safeParse({ email: email, password: '' }))).toEqual([
      'password',
    ])
  })

  it('rechaza una contraseña más larga de lo que acepta el servidor', () => {
    expect(platformLoginSchema.safeParse({ email: email, password: 'x'.repeat(128) }).success).toBe(true)
    expect(messages(platformLoginSchema.safeParse({ email: email, password: 'x'.repeat(129) }))).toEqual(['password'])
  })
})

describe('settingsPayload', () => {
  const BOTH = { name: true, timezone: true }
  const NEW = 'La Esquina 2'

  it('manda solo lo que cambió', () => {
    expect(settingsPayload({ name: ESQUINA, timezone: LIMA }, BOTH, DETAIL)).toEqual({})
    expect(settingsPayload({ name: NEW, timezone: LIMA }, BOTH, DETAIL)).toEqual({
      name: NEW,
    })
    expect(settingsPayload({ name: ESQUINA, timezone: BOGOTA }, BOTH, DETAIL)).toEqual({ timezone: BOGOTA })
  })

  it('no manda un campo que el usuario no tocó aunque difiera de lo guardado', () => {
    // Otro administrador cambió la zona a Bogotá mientras aquí se editaba el
    // nombre: el formulario todavía tiene Lima, pero no la devuelve.
    const reread = { ...DETAIL, timezone: BOGOTA }
    expect(settingsPayload({ name: NEW, timezone: LIMA }, { name: true }, reread)).toEqual({
      name: NEW,
    })
    expect(settingsPayload({ name: 'Viejo', timezone: BOGOTA }, { timezone: true }, DETAIL)).toEqual({
      timezone: BOGOTA,
    })
    expect(settingsPayload({ name: 'Viejo', timezone: BOGOTA }, {}, DETAIL)).toEqual({})
  })

  it('valida el nombre y la zona nueva como el alta', () => {
    expect(messages(restaurantSettingsSchema(LIMA).safeParse({ name: '  ', timezone: 'america/lima' }))).toEqual([
      'name',
      'timezone',
    ])
  })

  it('no vuelve a validar la zona que el restaurante ya tiene', () => {
    // Una zona que este navegador no conoce no impide cambiar el nombre.
    const saved = 'Mars/Olympus_Mons'
    expect(restaurantSettingsSchema(saved).safeParse({ name: 'Otro nombre', timezone: saved }).success).toBe(
      true,
    )
    expect(messages(restaurantSettingsSchema(saved).safeParse({ name: ESQUINA, timezone: 'Mars/Otra' }))).toEqual([
      'timezone',
    ])
  })
})
