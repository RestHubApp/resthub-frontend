export type Direction = 'up' | 'down'

/**
 * Los identificadores con uno movido un lugar hacia arriba o hacia abajo.
 *
 * El API pide la lista completa en el orden nuevo, no el movimiento, así que
 * se calcula acá. Si el elemento ya está en el borde, la lista queda igual.
 */
export function moveId(ids: readonly number[], id: number, direction: Direction): number[] {
  const copy = [...ids]
  const from = copy.indexOf(id)
  const until = direction === 'up' ? from - 1 : from + 1
  if (from === -1 || until < 0 || until >= copy.length) {
    return copy
  }
  copy.splice(from, 1)
  copy.splice(until, 0, id)
  return copy
}

/** Reordena una lista según los identificadores, para mostrar el cambio antes de que responda el servidor. */
export function sortByIds<T extends { readonly id: number }>(
  items: readonly T[],
  ids: readonly number[],
): T[] {
  const place = new Map(ids.map((id, index) => [id, index]))
  return [...items].sort((a, b) => (place.get(a.id) ?? 0) - (place.get(b.id) ?? 0))
}
