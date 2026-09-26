// Cambios sobre una lista guardada en el caché de consultas, con lo que ya
// devolvió el servidor. Así una pantalla muestra lo que se acaba de guardar
// sin esperar un segundo viaje para releer la lista; la relectura llega
// después, de fondo, y corrige cualquier diferencia.

interface Identified {
  readonly id: number
}

function siempre(): boolean {
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
  stays: (previous: T) => boolean = siempre,
): T[] {
  const previo = list.find((actual) => actual.id === item.id)
  if (previo !== undefined && stays(previo)) {
    return list.map((actual) => (actual.id === item.id ? item : actual))
  }
  const resto = list.filter((actual) => actual.id !== item.id)
  const donde = resto.findIndex((actual) => before(item, actual))
  return donde < 0 ? [...resto, item] : [...resto.slice(0, donde), item, ...resto.slice(donde)]
}

export function removeFromList<T extends Identified>(list: readonly T[], id: number): T[] {
  return list.filter((actual) => actual.id !== id)
}

/** Para listas que el servidor ordena por nombre. */
export function byName<T extends { readonly name: string }>(item: T, other: T): boolean {
  return item.name.localeCompare(other.name, 'es') < 0
}
