import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { ACTIVITY_PAGE_SIZE, activityQuery } from '@/api/activity'
import { ACTIVITY_FILTER_PARAM, ACTIVITY_PERSON_PARAM } from '@/services/paths'
import { activityParamsOf, type ActivityFilter, filterOf, personOf } from './activityFilters'

interface ActivitySelection {
  readonly filter: ActivityFilter | ''
  readonly person: number | null
}

/**
 * El filtro y la persona (que viven en la dirección, para poder enlazarlos), la
 * página de cada combinación y la consulta de la bitácora. La página se recuerda
 * por filtro y persona: al cambiar cualquiera de los dos, desde la lista o desde
 * un enlace, se empieza en la primera.
 */
export function useActivityLog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selection: ActivitySelection = {
    filter: filterOf(searchParams.get(ACTIVITY_FILTER_PARAM)),
    person: personOf(searchParams.get(ACTIVITY_PERSON_PARAM)),
  }
  const [pages, setPages] = useState<Readonly<Record<string, number>>>({})
  const pageKey = `${selection.filter}|${String(selection.person)}`
  const page = pages[pageKey] ?? 0
  const log = useQuery({
    ...activityQuery(activityParamsOf({ ...selection, page, pageSize: ACTIVITY_PAGE_SIZE })),
    placeholderData: keepPreviousData,
  })
  const total = log.data?.total ?? 0
  const select = (next: ActivitySelection) => {
    setSearchParams(
      {
        ...(next.filter === '' ? {} : { [ACTIVITY_FILTER_PARAM]: next.filter }),
        ...(next.person === null ? {} : { [ACTIVITY_PERSON_PARAM]: String(next.person) }),
      },
      { replace: true },
    )
  }

  return {
    ...selection,
    page,
    log,
    total,
    pageTotal: Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE)),
    setFilter: (filter: ActivityFilter | '') => {
      select({ ...selection, filter })
    },
    setPerson: (person: number | null) => {
      select({ ...selection, person })
    },
    setPage: (next: number) => {
      setPages({ ...pages, [pageKey]: next })
    },
  }
}
