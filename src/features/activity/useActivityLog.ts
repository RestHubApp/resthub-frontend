import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { ACTIVITY_PAGE_SIZE, activityQuery } from '@/api/activity'
import { ACTIVITY_FILTER_PARAM } from '@/services/paths'
import { activityParamsOf, type ActivityFilter, filterOf } from './activityFilters'

/**
 * El filtro (que vive en la dirección, para poder enlazarlo), la página de cada
 * filtro y la consulta de la bitácora. La página se recuerda por filtro: al
 * cambiar de filtro, desde la lista o desde un enlace, se empieza en la primera.
 */
export function useActivityLog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = filterOf(searchParams.get(ACTIVITY_FILTER_PARAM))
  const [pages, setPages] = useState<Readonly<Record<string, number>>>({})
  const page = pages[filter] ?? 0
  const log = useQuery({
    ...activityQuery(activityParamsOf(filter, page, ACTIVITY_PAGE_SIZE)),
    placeholderData: keepPreviousData,
  })
  const total = log.data?.total ?? 0

  return {
    filter,
    page,
    log,
    total,
    pageTotal: Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE)),
    setFilter: (value: ActivityFilter | '') => {
      setSearchParams(value === '' ? {} : { [ACTIVITY_FILTER_PARAM]: value }, { replace: true })
    },
    setPage: (next: number) => {
      setPages({ ...pages, [filter]: next })
    },
  }
}
