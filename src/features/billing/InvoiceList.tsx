import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { invoicesQuery } from '../../api/billing'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import TablePagination from '../../components/TablePagination'
import { errorMessage } from '../../services/api'
import { useTimeZone } from '../../store/session'
import InvoiceRow from './InvoiceRow'
import { useResendInvoice } from './useResendInvoice'

const PAGINA = 25

/** Los comprobantes emitidos, del más reciente al más antiguo, de a 25. */
export default function InvoiceList() {
  const timeZone = useTimeZone()
  const [pagina, setPagina] = useState(0)
  const emitidos = useQuery(invoicesQuery(pagina * PAGINA))
  const reenviar = useResendInvoice()
  const lista = emitidos.data?.items ?? []
  const paginas = Math.ceil((emitidos.data?.total ?? 0) / PAGINA)

  return (
    <>
      {emitidos.isPending ? <ListSkeleton label="Cargando comprobantes…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {emitidos.isError ? <FormMessage tone="error">{errorMessage(emitidos.error, 'No se pudieron cargar.')}</FormMessage> : null}
      {emitidos.isSuccess && lista.length === 0 ? <EmptyState title="Todavía no se emitió ningún comprobante" /> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {lista.map((invoice) => (
          <InvoiceRow
            key={invoice.id}
            invoice={invoice}
            timeZone={timeZone}
            resending={reenviar.isPending}
            onResend={() => {
              reenviar.mutate(invoice.id)
            }}
          />
        ))}
      </ul>
      {paginas > 1 ? <TablePagination actual={pagina} total={paginas} onChange={setPagina} /> : null}
    </>
  )
}
