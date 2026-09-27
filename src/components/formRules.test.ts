import { describe, expect, it } from '@jest/globals'

import { fieldIds } from './fieldIds'
import { decimalParaApi, decimalRule, textoObligatorio, textoOpcional } from './formRules'

function error(regla: { safeParse: (v: string) => { error?: { issues: { message: string }[] } } }, valor: string) {
  return regla.safeParse(valor).error?.issues[0]?.message
}

describe('reglas de formulario compartidas', () => {
  const precio = decimalRule({ max: 1000, decimales: 2, unidad: 'soles', obligatorio: true })
  const merma = decimalRule({ max: 50, decimales: 3, unidad: 'kg' })

  it('un monto obligatorio vacío pide el valor', () => {
    expect(error(precio, '  ')).toBe('Escribe un valor')
  })

  it('acepta coma o punto decimal con los decimales permitidos', () => {
    expect(precio.safeParse('28,50').success).toBe(true)
    expect(precio.safeParse('28.5').success).toBe(true)
    expect(error(precio, '28.505')).toBe('Escribe un número con hasta 2 decimales')
  })

  it('rechaza cero y lo que pasa del tope, que suele ser un error de tipeo', () => {
    expect(error(precio, '0')).toBe('Tiene que ser mayor que cero')
    expect(error(precio, '180000')).toBe('Como máximo 1000 soles. Revisa el dato')
  })

  it('un campo opcional vacío vale y viaja como null', () => {
    expect(merma.safeParse('').success).toBe(true)
    expect(decimalParaApi('  ')).toBeNull()
    expect(decimalParaApi(' 1,250 ')).toBe('1.250')
  })

  it('un texto obligatorio necesita al menos cinco caracteres y respeta el tope', () => {
    const motivo = textoObligatorio(20, 'Escribe el motivo')
    expect(error(motivo, '')).toBe('Escribe el motivo')
    expect(error(motivo, 'roto')).toBe('Escribe el motivo (al menos 5 caracteres)')
    expect(error(motivo, 'x'.repeat(21))).toBe('Usa como máximo 20 caracteres')
    expect(textoOpcional(5).safeParse('   ').success).toBe(true)
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
