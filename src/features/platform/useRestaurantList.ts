import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useDeferredValue, useState } from 'react'

import { platformRestaurantsQuery } from '@/api/platform'
import { pageCount, restaurantListParams } from './restaurantList'

/** La búsqueda, la página y la consulta de la lista de restaurantes. */
export function useRestaurantList() {
  const [text, setText] = useState('')
  const [page, setPage] = useState(0)
  const search = useDeferredValue(text)
  const list = useQuery({ ...platformRestaurantsQuery(restaurantListParams(search, page)), placeholderData: keepPreviousData })
  const total = list.data?.total ?? 0
  const changeText = (next: string) => {
    setText(next)
    setPage(0)
  }
  const emptyMessage = search.trim() === '' ? 'Todavía no hay restaurantes.' : 'Ningún restaurante coincide con la búsqueda.'

  return { text, changeText, page, setPage, list, total, pages: pageCount(total), emptyMessage }
}
