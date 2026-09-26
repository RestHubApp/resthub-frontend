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
  const correo = 'plataforma@resthub.dev'

  it('no exige el mínimo de la contraseña al entrar', () => {
    expect(platformLoginSchema.safeParse({ email: correo, password: 'x' }).success).toBe(true)
    expect(mensajes(platformLoginSchema.safeParse({ email: correo, password: '' }))).toEqual([
      'password',
    ])
  })

  it('rechaza una contraseña más larga de lo que acepta el servidor', () => {
    expect(platformLoginSchema.safeParse({ email: correo, password: 'x'.repeat(128) }).success).toBe(true)
    expect(mensajes(platformLoginSchema.safeParse({ email: correo, password: 'x'.repeat(129) }))).toEqual(['password'])
  })
})

describe('settingsPayload', () => {
  const AMBOS = { name: true, timezone: true }
  const NUEVO = 'La Esquina 2'

  it('manda solo lo que cambió', () => {
    expect(settingsPayload({ name: ESQUINA, timezone: LIMA }, AMBOS, DETALLE)).toEqual({})
    expect(settingsPayload({ name: NUEVO, timezone: LIMA }, AMBOS, DETALLE)).toEqual({
      name: NUEVO,
    })
    expect(settingsPayload({ name: ESQUINA, timezone: BOGOTA }, AMBOS, DETALLE)).toEqual({ timezone: BOGOTA })
  })

  it('no manda un campo que el usuario no tocó aunque difiera de lo guardado', () => {
    // Otro administrador cambió la zona a Bogotá mientras aquí se editaba el
    // nombre: el formulario todavía tiene Lima, pero no la devuelve.
    const releido = { ...DETALLE, timezone: BOGOTA }
    expect(settingsPayload({ name: NUEVO, timezone: LIMA }, { name: true }, releido)).toEqual({
      name: NUEVO,
    })
    expect(settingsPayload({ name: 'Viejo', timezone: BOGOTA }, { timezone: true }, DETALLE)).toEqual({
      timezone: BOGOTA,
    })
    expect(settingsPayload({ name: 'Viejo', timezone: BOGOTA }, {}, DETALLE)).toEqual({})
  })

  it('valida el nombre y la zona nueva como el alta', () => {
    expect(mensajes(restaurantSettingsSchema(LIMA).safeParse({ name: '  ', timezone: 'america/lima' }))).toEqual([
      'name',
      'timezone',
    ])
  })

  it('no vuelve a validar la zona que el restaurante ya tiene', () => {
    // Una zona que este navegador no conoce no impide cambiar el nombre.
    const guardada = 'Mars/Olympus_Mons'
    expect(restaurantSettingsSchema(guardada).safeParse({ name: 'Otro nombre', timezone: guardada }).success).toBe(
      true,
    )
    expect(mensajes(restaurantSettingsSchema(guardada).safeParse({ name: ESQUINA, timezone: 'Mars/Otra' }))).toEqual([
      'timezone',
    ])
  })
})
