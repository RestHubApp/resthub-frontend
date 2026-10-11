import { useDeferredValue, useMemo, useState } from 'react'

import type { OrderMenuSection } from '@/api/types'
import { visibleSections } from './menuFilter'
import type { DraftLine } from './useOrderDraft'

/** Cuántas porciones de cada plato hay en el borrador, sumando sus combinaciones. */
function countByDish(lines: readonly DraftLine[]): Map<number, number> {
  const account = new Map<number, number>()
  for (const line of lines) {
    account.set(line.menuItemId, (account.get(line.menuItemId) ?? 0) + line.quantity)
  }
  return account
}

/**
 * Lo que filtra la carta: la busqueda, la categoria elegida y las secciones que quedan.
 *
 * Tambien cuenta cuantas porciones de cada plato hay en el borrador.
 */
export function useMenuFilters(categories: readonly OrderMenuSection[] | undefined, lines: readonly DraftLine[]) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<number | null>(null)
  const term = useDeferredValue(search)
  const quantities = useMemo(() => countByDish(lines), [lines])
  const sections = useMemo(() => visibleSections(categories ?? [], term, category), [categories, term, category])
  return { search, setSearch, category, setCategory, term, quantities, sections }
}
