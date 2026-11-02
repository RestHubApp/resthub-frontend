// Los números de las líneas de una orden de compra, con los límites del
// servidor: la cantidad con hasta 3 decimales y el costo con hasta 6. Más
// decimales o más cifras se rechazarían con un mensaje del API en inglés, así
// que se revisan antes de enviar.

// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const QUANTITY = /^\d{1,9}(?:\.\d{1,3})?$/u
// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const COST = /^\d{1,8}(?:\.\d{1,6})?$/u

/** El aviso cuando un número escrito no cabe en lo que acepta el servidor. */
export const LINE_NUMBERS_HINT = 'Usa hasta 3 decimales en la cantidad y hasta 6 en el costo.'

/** Un número escrito con coma o punto decimal, como lo espera el servidor. */
export function decimalText(value: string): string {
  return value.trim().replace(',', '.')
}

/** Si una cantidad (ya con punto decimal) cabe en el servidor. */
export function isLineQuantity(value: string): boolean {
  return QUANTITY.test(value)
}

/** Si un costo (ya con punto decimal) cabe en el servidor. */
export function isLineCost(value: string): boolean {
  return COST.test(value)
}

/** Si alguna cantidad o costo ya escrito no cabe: para explicar por qué no se puede enviar. */
export function hasInvalidLineNumber(lines: readonly { readonly quantity: string; readonly cost: string }[]): boolean {
  return lines.some(
    (line) => (line.quantity !== '' && !isLineQuantity(decimalText(line.quantity))) || (line.cost !== '' && !isLineCost(decimalText(line.cost))),
  )
}
