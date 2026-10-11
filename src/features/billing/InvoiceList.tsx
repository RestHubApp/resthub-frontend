import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { invoicesQuery } from '@/api/billing'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { TablePagination } from '@/components/TablePagination'
import { errorMessage } from '@/services/api'
import { useTimeZone } from '@/store/session'
import { InvoiceRow } from './InvoiceRow'
import { useResendInvoice } from './useResendInvoice'

const PAGE = 25

/** Los comprobantes emitidos, del más reciente al más antiguo, de a 25. */
export function InvoiceList() {
  const timeZone = useTimeZone()
  const [page, setPage] = useState(0)
  const issued = useQuery(invoicesQuery(page * PAGE))
  const resend = useResendInvoice()
  const list = issued.data?.items ?? []
  const pages = Math.ceil((issued.data?.total ?? 0) / PAGE)

  return (
    <>
      {issued.isPending ? <ListSkeleton label="Cargando comprobantes…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {issued.isError ? <RetryQueryError message={errorMessage(issued.error, 'No se pudieron cargar los comprobantes.')} onRetry={() => { void issued.refetch() }} /> : null}
      {issued.isSuccess && list.length === 0 ? <EmptyState title="Todavía no se emitió ningún comprobante" /> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {list.map((invoice) => (
          <InvoiceRow
            key={invoice.id}
            invoice={invoice}
            timeZone={timeZone}
            resending={resend.isPending}
            onResend={() => {
              resend.mutate(invoice.id)
            }}
          />
        ))}
      </ul>
      {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
    </>
  )
}
