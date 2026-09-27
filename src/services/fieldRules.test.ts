import { describe, expect, it } from '@jest/globals'

import {
  correoRule,
  MAX_PASSWORD,
  nombreRule,
  passwordRule,
  soloDigitos,
  soloLetras,
  soloTelefono,
  telefonoRule,
} from './fieldRules'

function mensaje(resultado: { success: boolean; error?: { issues: { message: string }[] } }): string | undefined {
  return resultado.error?.issues[0]?.message
}

describe('reglas de los datos de una persona', () => {
  it('un nombre admite tildes, eñes, guiones y apóstrofos', () => {
    const regla = nombreRule('nombre', 120)
    for (const nombre of ['María José', 'Pérez-Luna', "O'Brien", 'Ñahui']) {
      expect(regla.safeParse(nombre).success).toBe(true)
    }
  })

  it('un nombre con números o vacío se rechaza con un mensaje para quien escribe', () => {
    const propio = nombreRule('nombre', 120)
    const ajeno = nombreRule('apellido', 120, 'el')
    expect(mensaje(propio.safeParse('   '))).toBe('Escribe tu nombre')
    expect(mensaje(ajeno.safeParse(''))).toBe('Escribe el apellido')
    expect(mensaje(propio.safeParse('Ana2'))).toBe('Tu nombre solo puede llevar letras, espacios, guiones o apóstrofos')
    expect(mensaje(nombreRule('nombre', 3).safeParse('Anita'))).toBe('Usa como máximo 3 caracteres')
  })

  it('el correo se guarda en minúsculas y sin espacios', () => {
    expect(correoRule.parse('  Ana@RestHub.DEV ')).toBe('ana@resthub.dev')
    expect(mensaje(correoRule.safeParse('ana@'))).toBe('Escribe un correo válido, como nombre@correo.com')
  })

  it('el teléfono es opcional, pero si se escribe lleva de 7 a 15 dígitos', () => {
    expect(telefonoRule.safeParse('').success).toBe(true)
    expect(telefonoRule.safeParse('+51 987 654 321').success).toBe(true)
    expect(telefonoRule.safeParse('12345').success).toBe(false)
    expect(telefonoRule.safeParse('1234567890123456').success).toBe(false)
    expect(telefonoRule.safeParse('987-654-321').success).toBe(false)
  })

  it('la contraseña tiene entre 10 y 128 caracteres', () => {
    expect(mensaje(passwordRule.safeParse('corta'))).toBe('Usa al menos 10 caracteres')
    expect(passwordRule.safeParse('suficiente1').success).toBe(true)
    expect(passwordRule.safeParse('x'.repeat(MAX_PASSWORD + 1)).success).toBe(false)
  })
})

describe('limpieza mientras se escribe', () => {
  it('deja solo lo que puede ir en cada campo', () => {
    expect(soloLetras('Ana 2#-Luz!')).toBe('Ana -Luz')
    expect(soloDigitos('20-123.456 789')).toBe('20123456789')
    expect(soloTelefono('+51 (987) 654-321')).toBe('+51 987 654321')
  })
})
