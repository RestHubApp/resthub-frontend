// El identificador corto del restaurante (`la-esquina-de-lucho`). Va en URLs y
// en nombres de archivos exportados, así que el backend lo limita a
// minúsculas, números y guiones. Las reglas repiten las del servidor, que
// sigue siendo quien decide.

export const MAX_SLUG = 60
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

function sinTildes(valor: string): string {
  return valor.normalize('NFD').replace(/\p{M}/gu, '')
}

/**
 * Un identificador a partir del nombre: «Café Ñandú & Co.» → `cafe-nandu-co`.
 *
 * Cada tramo que no es letra ni número queda en un solo guion, así que en
 * los extremos sobra a lo más uno.
 */
export function suggestSlug(name: string): string {
  return sinTildes(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-/u, '')
    .slice(0, MAX_SLUG)
    .replace(/-$/u, '')
}

/**
 * Limpia lo que se escribe en el campo mientras se escribe.
 *
 * Deja pasar un guion al final porque la persona puede estar por escribir la
 * palabra siguiente; la regla del formulario lo rechaza si queda así.
 */
export function sanitizeSlugInput(value: string): string {
  return sinTildes(value)
    .toLowerCase()
    .replace(/\s+/gu, '-')
    .replace(/[^a-z0-9-]/gu, '')
    .replace(/-{2,}/gu, '-')
}

export function isValidSlug(value: string): boolean {
  return value.length <= MAX_SLUG && SLUG_PATTERN.test(value)
}

/**
 * El identificador después de cambiar el nombre.
 *
 * Sigue al nombre mientras la persona no lo haya tocado: si todavía es el que
 * se sugirió para el nombre anterior, o está vacío. Si lo editó a mano, se
 * respeta.
 */
export function followSlug(previousName: string, nextName: string, currentSlug: string): string {
  const siguiendo = currentSlug === '' || currentSlug === suggestSlug(previousName)
  return siguiendo ? suggestSlug(nextName) : currentSlug
}
