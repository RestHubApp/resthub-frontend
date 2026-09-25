import { z } from 'zod'

// Reglas de formulario que comparten pantallas de distintas partes: textos
// libres y montos (precios, costos, cantidades).
//
// Los limites repiten los del backend. Repetirlos no duplica la regla, que
// sigue viviendo en el servidor: avisa mientras la persona escribe.

/** Un texto que explica algo necesita al menos unas palabras. */
export const MIN_TEXTO = 5

function maximo(max: number): string {
  return `Usa como máximo ${String(max)} caracteres`
}

/** Un texto obligatorio: se recorta y necesita al menos cinco caracteres. */
export function textoObligatorio(max: number, pedido: string) {
  return z.string().trim().min(1, pedido).min(MIN_TEXTO, `${pedido} (al menos ${String(MIN_TEXTO)} caracteres)`).max(max, maximo(max))
}

export function textoOpcional(max: number) {
  return z.string().trim().max(max, maximo(max))
}

interface NumeroDecimal {
  readonly max: number
  readonly decimales: number
  readonly unidad: string
  readonly obligatorio?: boolean
}

/**
 * Un numero positivo escrito en un campo de texto, con tope y decimales.
 *
 * Vacio vale cuando el campo es opcional. El tope no es arbitrario: un peso de
 * S/ 180000 por un plato no es un plato caro, es un error de tipeo.
 */
export function decimalRule({ max, decimales, unidad, obligatorio = false }: NumeroDecimal) {
  const formato = new RegExp(`^\\d+(?:[.,]\\d{1,${String(decimales)}})?$`, 'u')
  return z
    .string()
    .trim()
    .refine((valor) => !obligatorio || valor !== '', 'Escribe un valor')
    .refine(
      (valor) => valor === '' || formato.test(valor),
      `Escribe un número con hasta ${String(decimales)} decimales`,
    )
    .refine(
      (valor) => valor === '' || Number(valor.replace(',', '.')) > 0,
      'Tiene que ser mayor que cero',
    )
    .refine(
      (valor) => valor === '' || Number(valor.replace(',', '.')) <= max,
      `Como máximo ${String(max)} ${unidad}. Revisa el dato`,
    )
}

/** El valor que espera la API: con punto decimal, o `null` si esta vacio. */
export function decimalParaApi(valor: string): string | null {
  const limpio = valor.trim().replace(',', '.')
  return limpio === '' ? null : limpio
}
