import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { CASH_PAGE_SIZE, cashSessionsQuery } from '../../api/cash'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import TablePagination from '../../components/TablePagination'
import { errorMessage } from '../../services/api'
import CashSessionDialog from './CashSessionDialog'
import CashSessionRow from './CashSessionRow'

/** Los turnos cerrados, del más reciente al más antiguo; tocando uno se ve su arqueo. */
export default function CashHistory() {
  const [pagina, setPagina] = useState(0)
  const [abierto, setAbierto] = useState<number | null>(null)
  const turnos = useQuery(cashSessionsQuery(pagina * CASH_PAGE_SIZE))
  const lista = turnos.data?.items ?? []
  const paginas = Math.max(1, Math.ceil((turnos.data?.total ?? 0) / CASH_PAGE_SIZE))

  return (
    <div className="flex flex-col gap-3">
      {turnos.isPending ? <ListSkeleton label="Cargando turnos…" count={4} itemClassName="h-14 rounded-lg" /> : null}
      {turnos.isError ? (
        <FormMessage tone="error">{errorMessage(turnos.error, 'No se pudieron cargar los turnos.')}</FormMessage>
      ) : null}
      {turnos.isSuccess && lista.length === 0 ? <EmptyState title="Todavía no hay turnos de caja" /> : null}
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {lista.map((turno) => (
          <CashSessionRow key={turno.id} session={turno} onOpen={setAbierto} />
        ))}
      </ul>
      {paginas > 1 ? <TablePagination actual={pagina} total={paginas} onChange={setPagina} /> : null}
      <CashSessionDialog
        sessionId={abierto}
        onClose={() => {
          setAbierto(null)
        }}
      />
    </div>
  )
}
