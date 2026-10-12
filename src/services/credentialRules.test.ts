import { describe, expect, it } from '@jest/globals'

import { credentialError, normalizeEmail, validateCredentials } from './credentialRules'

const EMAIL = 'plataforma@resthub.dev'
const INVALID_EMAIL = 'Escribe un correo válido, como nombre@correo.com'

describe('reglas del acceso', () => {
  it('acepta un correo normal, con espacios y mayúsculas alrededor', () => {
    expect(credentialError('email', EMAIL)).toBeUndefined()
    expect(credentialError('email', '  Ana@Correo.com ')).toBeUndefined()
    expect(normalizeEmail('  Ana@Correo.com ')).toBe('ana@correo.com')
  })

  it('rechaza lo que no tiene forma de correo', () => {
    for (const email of ['', 'maria', '@correo.com', 'ana@', 'ana@correo', 'ana@@correo.com', 'a na@correo.com', 'ana@.com', 'ana@correo.']) {
      expect(credentialError('email', email)).toBe(INVALID_EMAIL)
    }
  })

  it('no exige el mínimo de la contraseña al entrar', () => {
    expect(credentialError('password', 'x')).toBeUndefined()
    expect(credentialError('password', '')).toBe('Escribe tu contraseña')
  })

  it('rechaza una contraseña más larga de lo que acepta el servidor', () => {
    expect(credentialError('password', 'x'.repeat(128))).toBeUndefined()
    expect(credentialError('password', 'x'.repeat(129))).toBe('Usa como máximo 128 caracteres')
  })

  it('junta los errores de los dos campos, y nada si está bien', () => {
    expect(validateCredentials({ email: 'no', password: '' })).toEqual({ email: INVALID_EMAIL, password: 'Escribe tu contraseña' })
    expect(validateCredentials({ email: EMAIL, password: 'x' })).toEqual({})
  })
})
