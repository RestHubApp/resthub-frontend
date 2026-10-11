import { useMemo, useState } from 'react'

/**
 * Parte una lista en páginas.
 *
 * Sin tamaño, devuelve la lista entera en una sola página. Si la lista se
 * achica (un filtro nuevo), la página actual se acomoda a la última que exista
 * en vez de quedar vacía.
 */
export function usePagination<T>(items: readonly T[], pageSize: number | undefined) {
  const [page, setPage] = useState(0)
  const size = pageSize ?? Math.max(items.length, 1)
  const total = Math.max(1, Math.ceil(items.length / size))
  const actual = Math.min(page, total - 1)
  const visible = useMemo(
    () => items.slice(actual * size, (actual + 1) * size),
    [items, actual, size],
  )

  return { visibles: visible, actual, total, irA: setPage }
}
