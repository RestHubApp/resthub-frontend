import { describe, expect, it } from '@jest/globals'

import { fieldIds } from './fieldIds'
import { decimalForApi, decimalRule, textRequired, textOptional } from './formRules'

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
