// Cambios sobre una lista guardada en el caché de consultas, con lo que ya
// devolvió el servidor. Así una pantalla muestra lo que se acaba de guardar
// sin esperar un segundo viaje para releer la lista; la relectura llega
// después, de fondo, y corrige cualquier diferencia.

interface Identified {
  readonly id: number
}

function always(): boolean {
  return true
}

/**
 * La lista con `item` agregado o actualizado.
 *
 * Si ya estaba y `stays` dice que su lugar no cambió, queda donde estaba; si
 * no, entra antes del primer elemento que debe seguirle según `before`, o al
 * final.
 */
export function upsertInList<T extends Identified>(
  list: readonly T[],
  item: T,
  before: (item: T, other: T) => boolean,
  stays: (previous: T) => boolean = always,
): T[] {
  const previous = list.find((actual) => actual.id === item.id)
  if (previous !== undefined && stays(previous)) {
    return list.map((actual) => (actual.id === item.id ? item : actual))
  }
  const rest = list.filter((actual) => actual.id !== item.id)
  const where = rest.findIndex((actual) => before(item, actual))
  return where < 0 ? [...rest, item] : [...rest.slice(0, where), item, ...rest.slice(where)]
}

export function removeFromList<T extends Identified>(list: readonly T[], id: number): T[] {
  return list.filter((actual) => actual.id !== id)
}

/** Para listas que el servidor ordena por nombre. */
export function byName<T extends { readonly name: string }>(item: T, other: T): boolean {
  return item.name.localeCompare(other.name, 'es') < 0
}
