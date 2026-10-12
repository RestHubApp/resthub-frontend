import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { movementsQuery } from '@/api/inventory'
import type { MovementKind, MovementListParams } from '@/api/types'

const BY_PAGE = 20

/**
 * El libro de movimientos con sus filtros (insumo y tipo) y la página abierta.
 *
 * Cambiar un filtro vuelve a la primera página.
 */
export function useMovementBook() {
  const [ingredient, setIngredient] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(0)

  const params: MovementListParams = {
    limit: BY_PAGE,
    offset: page * BY_PAGE,
    ...(ingredient === '' ? {} : { ingredient_id: Number(ingredient) }),
    ...(type === '' ? {} : { kind: [type as MovementKind] }),
  }
  const book = useQuery({ ...movementsQuery(params), placeholderData: keepPreviousData })
  const pages = Math.max(1, Math.ceil((book.data?.total ?? 0) / BY_PAGE))

  return {
    book,
    pages,
    page,
    setPage,
    ingredient,
    type,
    changeIngredient: (value: string) => {
      setIngredient(value)
      setPage(0)
    },
    changeType: (value: string) => {
      setType(value)
      setPage(0)
    },
  }
}
