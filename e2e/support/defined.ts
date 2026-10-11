// Aserción de prueba: un valor que la prueba da por existente. Si falta, la
// prueba falla con un mensaje claro y, para el compilador, el valor ya no es
// `undefined`.

/** Devuelve el valor o lanza si no existe (`undefined`). */
export function defined<T>(value: T | undefined, what = 'el valor'): T {
  if (value === undefined) {
    throw new Error(`Se esperaba ${what} y no existe`)
  }
  return value
}
