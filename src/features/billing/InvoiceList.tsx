import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { invoicesQuery } from '@/api/billing'
import { TablePagination } from '@/components/TablePagination'
import { useTimeZone } from '@/store/session'
import { InvoiceListStatus } from './InvoiceListStatus'
import { InvoiceRow } from './InvoiceRow'
import type { InvoiceSlot } from './invoiceSlot'
import { useResendInvoice } from './useResendInvoice'

const PAGE = 25

/** Los comprobantes emitidos, del más reciente al más antiguo, de a 25. */
export function InvoiceList({ Slot }: { readonly Slot?: InvoiceSlot | undefined }) {
  const timeZone = useTimeZone()
  const [page, setPage] = useState(0)
  const issued = useQuery(invoicesQuery(page * PAGE))
  const resend = useResendInvoice()
  const list = issued.data?.items ?? []
  const pages = Math.ceil((issued.data?.total ?? 0) / PAGE)

  return (
    <>
      <InvoiceListStatus
        isPending={issued.isPending}
        isError={issued.isError}
        isEmpty={issued.isSuccess && list.length === 0}
        error={issued.error}
        onRetry={() => {
          void issued.refetch()
        }}
      />
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {list.map((invoice) => (
          <InvoiceRow
            key={invoice.id}
            invoice={invoice}
            timeZone={timeZone}
            resending={resend.isPending}
            Slot={Slot}
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
