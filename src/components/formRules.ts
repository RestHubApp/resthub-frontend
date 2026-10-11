import { z } from 'zod'

// Reglas de formulario que comparten pantallas de distintas partes: textos
// libres y montos (precios, costos, cantidades).
//
// Los limites repiten los del backend. Repetirlos no duplica la regla, que
// sigue viviendo en el servidor: avisa mientras la persona escribe.

/** Un texto que explica algo necesita al menos unas palabras. */
export const MIN_TEXT = 5

function handleMax(max: number): string {
  return `Usa como máximo ${String(max)} caracteres`
}

/** Un texto obligatorio: se recorta y necesita al menos cinco caracteres. */
export function textRequired(max: number, order: string) {
  return z.string().trim().min(1, order).min(MIN_TEXT, `${order} (al menos ${String(MIN_TEXT)} caracteres)`).max(max, handleMax(max))
}

export function textOptional(max: number) {
  return z.string().trim().max(max, handleMax(max))
}

interface NumberDecimal {
  readonly max: number
  readonly decimals: number
  readonly unit: string
  readonly required?: boolean
}

/**
 * Un numero positivo escrito en un campo de texto, con tope y decimales.
 *
 * Vacio vale cuando el campo es opcional. El tope no es arbitrario: un peso de
 * S/ 180000 por un plato no es un plato caro, es un error de tipeo.
 */
export function decimalRule({ max, decimals, unit, required = false }: NumberDecimal) {
  // eslint-disable-next-line security/detect-non-literal-regexp -- solo interpola un número fijado en el código, nunca texto del usuario
  const format = new RegExp(`^\\d+(?:[.,]\\d{1,${String(decimals)}})?$`, 'u')
  return z
    .string()
    .trim()
    .refine((value) => !required || value !== '', 'Escribe un valor')
    .refine(
      (value) => value === '' || format.test(value),
      `Escribe un número con hasta ${String(decimals)} decimales`,
    )
    .refine(
      (value) => value === '' || Number(value.replace(',', '.')) > 0,
      'Tiene que ser mayor que cero',
    )
    .refine(
      (value) => value === '' || Number(value.replace(',', '.')) <= max,
      `Como máximo ${String(max)} ${unit}. Revisa el dato`,
    )
}

/** El valor que espera la API: con punto decimal, o `null` si esta vacio. */
export function decimalForApi(value: string): string | null {
  const clean = value.trim().replace(',', '.')
  return clean === '' ? null : clean
}
