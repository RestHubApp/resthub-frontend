import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { ordersQuery } from '@/api/orders'
import { todayIn } from '@/services/format'
import { useTimeZone } from '@/store/session'
import { buildColumns } from './HistoryColumns'
import { type HistoryFilters, PAGE_SIZE, toParams } from './historyFilters'

/**
 * El estado del historial: filtros, pagina, consulta al servidor y columnas.
 *
 * Arranca en el dia de hoy. Al cambiar los filtros vuelve a la primera pagina.
 */
export function useHistoryList() {
  const timeZone = useTimeZone()
  const today = todayIn(timeZone)
  const columns = useMemo(() => buildColumns(timeZone), [timeZone])
  const [filters, setFilters] = useState<HistoryFilters>({ from: today, to: today, status: '', type: '', waiterId: '' })
  const [page, setPage] = useState(0)
  const history = useQuery({ ...ordersQuery(toParams(filters, page)), placeholderData: keepPreviousData })
  const total = history.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const changeFilters = (fresh: HistoryFilters) => {
    setFilters(fresh)
    setPage(0)
  }
  return { columns, filters, changeFilters, page, setPage, history, total, pages }
}
