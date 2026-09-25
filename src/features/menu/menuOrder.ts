export type Direction = 'up' | 'down'

/**
 * Los identificadores con uno movido un lugar hacia arriba o hacia abajo.
 *
 * El API pide la lista completa en el orden nuevo, no el movimiento, así que
 * se calcula acá. Si el elemento ya está en el borde, la lista queda igual.
 */
export function moveId(ids: readonly number[], id: number, direction: Direction): number[] {
  const copia = [...ids]
  const desde = copia.indexOf(id)
  const hasta = direction === 'up' ? desde - 1 : desde + 1
  if (desde === -1 || hasta < 0 || hasta >= copia.length) {
    return copia
  }
  copia.splice(desde, 1)
  copia.splice(hasta, 0, id)
  return copia
}

/** Reordena una lista según los identificadores, para mostrar el cambio antes de que responda el servidor. */
export function sortByIds<T extends { readonly id: number }>(
  items: readonly T[],
  ids: readonly number[],
): T[] {
  const lugar = new Map(ids.map((id, indice) => [id, indice]))
  return [...items].sort((a, b) => (lugar.get(a.id) ?? 0) - (lugar.get(b.id) ?? 0))
}
