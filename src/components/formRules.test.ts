import { describe, expect, it } from '@jest/globals'

import { fieldIds } from './fieldIds'
import { decimalForApi, decimalRule, phoneOptional, textRequired, textOptional } from './formRules'

function error(rule: { safeParse: (v: string) => { error?: { issues: { message: string }[] } } }, value: string) {
  return rule.safeParse(value).error?.issues[0]?.message
}

describe('reglas de formulario compartidas', () => {
  const price = decimalRule({ max: 1000, decimals: 2, unit: 'soles', required: true })
  const waste = decimalRule({ max: 50, decimals: 3, unit: 'kg' })

  it('un monto obligatorio vacío pide el valor', () => {
    expect(error(price, '  ')).toBe('Escribe un valor')
  })

  it('acepta coma o punto decimal con los decimales permitidos', () => {
    expect(price.safeParse('28,50').success).toBe(true)
    expect(price.safeParse('28.5').success).toBe(true)
    expect(error(price, '28.505')).toBe('Escribe un número con hasta 2 decimales')
  })

  it('rechaza cero y lo que pasa del tope, que suele ser un error de tipeo', () => {
    expect(error(price, '0')).toBe('Tiene que ser mayor que cero')
    expect(error(price, '180000')).toBe('Como máximo 1000 soles. Revisa el dato')
  })

  it('un campo opcional vacío vale y viaja como null', () => {
    expect(waste.safeParse('').success).toBe(true)
    expect(decimalForApi('  ')).toBeNull()
    expect(decimalForApi(' 1,250 ')).toBe('1.250')
  })

  it('un texto obligatorio necesita al menos cinco caracteres y respeta el tope', () => {
    const reason = textRequired(20, 'Escribe el motivo')
    expect(error(reason, '')).toBe('Escribe el motivo')
    expect(error(reason, 'roto')).toBe('Escribe el motivo (al menos 5 caracteres)')
    expect(error(reason, 'x'.repeat(21))).toBe('Usa como máximo 20 caracteres')
    expect(textOptional(5).safeParse('   ').success).toBe(true)
  })
})

describe('fieldIds', () => {
  it('enlaza la ayuda y el error del campo para el lector de pantalla', () => {
    expect(fieldIds('precio', 'En soles', 'Falta')).toEqual({
      hintId: 'precio-ayuda',
      errorId: 'precio-error',
      describedBy: 'precio-ayuda precio-error',
    })
    expect(fieldIds('precio', 'En soles').describedBy).toBe('precio-ayuda')
    expect(fieldIds('precio').describedBy).toBeUndefined()
  })
})

describe('teléfono de contacto (la regla del backend)', () => {
  const phone = phoneOptional(20)
  const WRONG = 'Escribe solo números y espacios, con + al inicio si hace falta (de 6 a 20), como 987 654 321'

  it('acepta vacío, dígitos con espacios y el + del código de país', () => {
    for (const value of ['', '   ', '987654321', '987 654 321', '+51 987 654 321', '012345']) {
      expect(phone.safeParse(value).success).toBe(true)
    }
  })

  it('rechaza guiones, letras, el enmascarado y lo que no llega a 6 caracteres', () => {
    for (const value of ['987-654-321', '98765a321', '987•••321', '12345', '+51+987654321']) {
      expect(error(phone, value)).toBe(WRONG)
    }
  })

  it('el tope del campo sigue avisando primero con su propio mensaje', () => {
    expect(error(phone, '1'.repeat(21))).toBe('Usa como máximo 20 caracteres')
  })
})
