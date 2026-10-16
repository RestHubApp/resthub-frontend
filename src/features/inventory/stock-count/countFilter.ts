import type { StockCountLine } from '@/api/types'

/** Qué líneas se ven: todas, las que faltan o las ya contadas. */
export type CountFilter = 'all' | 'pending' | 'counted'

export const COUNT_FILTERS: readonly { readonly value: CountFilter; readonly label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'counted', label: 'Contados' },
]

// «Limón» se encuentra escribiendo «limon».
export function plainText(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase().trim()
}

/** Si el nombre contiene lo buscado (ya pasado por `plainText`); sin búsqueda, todos. */
export function matchesSearch(name: string, wanted: string): boolean {
  return wanted === '' || plainText(name).includes(wanted)
}

function matchesFilter(line: StockCountLine, filter: CountFilter): boolean {
  if (filter === 'all') {
    return true
  }
  return filter === 'counted' ? line.counted !== null : line.counted === null
}

/** Las líneas que se ven con la búsqueda y el filtro, en el orden del conteo. */
export function visibleLines(lines: readonly StockCountLine[], search: string, filter: CountFilter): readonly StockCountLine[] {
  const wanted = plainText(search)
  return lines.filter((line) => matchesFilter(line, filter) && matchesSearch(line.ingredient_name, wanted))
}
