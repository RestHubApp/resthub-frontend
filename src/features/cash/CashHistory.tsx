import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { CASH_PAGE_SIZE, cashSessionsQuery } from '@/api/cash'
import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { TablePagination } from '@/components/TablePagination'
import { errorMessage } from '@/services/api'
import { CashSessionDialog } from './CashSessionDialog'
import { CashSessionRow } from './CashSessionRow'

/** Los turnos cerrados, del más reciente al más antiguo; tocando uno se ve su arqueo. */
export function CashHistory() {
  const [page, setPage] = useState(0)
  const [open, openSet] = useState<number | null>(null)
  const shifts = useQuery(cashSessionsQuery(page * CASH_PAGE_SIZE))
  const list = shifts.data?.items ?? []
  const pages = Math.max(1, Math.ceil((shifts.data?.total ?? 0) / CASH_PAGE_SIZE))

  return (
    <div className="flex flex-col gap-3">
      {shifts.isPending ? <ListSkeleton label="Cargando turnos…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {shifts.isError ? (
        <FormMessage tone="error">{errorMessage(shifts.error, 'No se pudieron cargar los turnos.')}</FormMessage>
      ) : null}
      {shifts.isSuccess && list.length === 0 ? <EmptyState title="Todavía no hay turnos de caja" /> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {list.map((shift) => (
          <CashSessionRow key={shift.id} session={shift} onOpen={openSet} />
        ))}
      </ul>
      {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
      <CashSessionDialog
        sessionId={open}
        onClose={() => {
          openSet(null)
        }}
      />
    </div>
  )
}
