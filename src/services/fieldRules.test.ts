import { describe, expect, it } from '@jest/globals'

import {
  emailRule,
  MAX_PASSWORD,
  nameRule,
  passwordRule,
  onlyDigits,
  onlyLetters,
  onlyPhone,
  phoneRule,
} from './fieldRules'

function message(result: { success: boolean; error?: { issues: { message: string }[] } }): string | undefined {
  return result.error?.issues[0]?.message
}

describe('reglas de los datos de una persona', () => {
  it('un nombre admite tildes, eñes, guiones y apóstrofos', () => {
    const rule = nameRule('nombre', 120)
    for (const name of ['María José', 'Pérez-Luna', "O'Brien", 'Ñahui']) {
      expect(rule.safeParse(name).success).toBe(true)
    }
  })

  it('un nombre con números o vacío se rechaza con un mensaje para quien escribe', () => {
    const own = nameRule('nombre', 120)
    const foreign = nameRule('apellido', 120, 'el')
    expect(message(own.safeParse('   '))).toBe('Escribe tu nombre')
    expect(message(foreign.safeParse(''))).toBe('Escribe el apellido')
    expect(message(own.safeParse('Ana2'))).toBe('Tu nombre solo puede llevar letras, espacios, guiones o apóstrofos')
    expect(message(nameRule('nombre', 3).safeParse('Anita'))).toBe('Usa como máximo 3 caracteres')
  })

  it('el correo se guarda en minúsculas y sin espacios', () => {
    expect(emailRule.parse('  Ana@RestHub.DEV ')).toBe('ana@resthub.dev')
    expect(message(emailRule.safeParse('ana@'))).toBe('Escribe un correo válido, como nombre@correo.com')
  })

  it('el teléfono es opcional, pero si se escribe lleva de 7 a 15 dígitos', () => {
    expect(phoneRule.safeParse('').success).toBe(true)
    expect(phoneRule.safeParse('+51 987 654 321').success).toBe(true)
    expect(phoneRule.safeParse('12345').success).toBe(false)
    expect(phoneRule.safeParse('1234567890123456').success).toBe(false)
    expect(phoneRule.safeParse('987-654-321').success).toBe(false)
  })

  it('la contraseña tiene entre 10 y 128 caracteres', () => {
    expect(message(passwordRule.safeParse('corta'))).toBe('Usa al menos 10 caracteres')
    expect(passwordRule.safeParse('suficiente1').success).toBe(true)
    expect(passwordRule.safeParse('x'.repeat(MAX_PASSWORD + 1)).success).toBe(false)
  })
})

describe('limpieza mientras se escribe', () => {
  it('deja solo lo que puede ir en cada campo', () => {
    expect(onlyLetters('Ana 2#-Luz!')).toBe('Ana -Luz')
    expect(onlyDigits('20-123.456 789')).toBe('20123456789')
    expect(onlyPhone('+51 (987) 654-321')).toBe('+51 987 654321')
  })
})
