import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { stockCountsQuery } from '@/api/stockCounts'
import { TablePagination } from '@/components/TablePagination'
import { StockCountHistoryStatus } from './StockCountHistoryStatus'
import { StockCountRow } from './StockCountRow'

const PAGE_SIZE = 20

/** Los conteos, del más nuevo al más viejo; cada uno abre su lista o su reporte de diferencias. */
export function StockCountHistory() {
  const [page, setPage] = useState(0)
  const counts = useQuery(stockCountsQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }))
  const items = counts.data?.items ?? []
  const pages = Math.max(1, Math.ceil((counts.data?.total ?? 0) / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-3">
      <StockCountHistoryStatus isPending={counts.isPending} error={counts.error} isEmpty={items.length === 0} />
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {items.map((count) => (
          <StockCountRow key={count.id} count={count} />
        ))}
      </ul>
      {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
    </div>
  )
}
