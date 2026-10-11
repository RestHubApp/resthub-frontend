import { BackLink } from '@/components/BackLink'
import { DataTable } from '@/components/DataTable'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { paths } from '@/services/paths'
import { HistoryFiltersBar } from './history/HistoryFiltersBar'
import { OrderSummary } from './history/OrderSummary'
import { useHistoryList } from './history/useHistoryList'
import { QueryError } from './QueryError'

/**
 * El historial de pedidos del encargado, con filtros y el detalle de cada uno.
 *
 * Se pagina en el servidor: un mes de pedidos no entra en una sola respuesta.
 * Arranca en el dia de hoy, que es lo que se revisa al cerrar la caja.
 */
export function HistoryView() {
  const { columns, filters, changeFilters, page, setPage, history, total, pages } = useHistoryList()

  return (
    <div className="flex flex-col gap-5">
      <BackLink to={paths.board.list} label="Tablero" />
      <PageHeader title="Historial de pedidos" description="Todos los pedidos: pagados, cancelados o en curso." />
      <SectionCard title="Filtros" as="h2">
        <HistoryFiltersBar value={filters} onChange={changeFilters} />
      </SectionCard>
      <SectionCard title="Pedidos" description={history.isSuccess ? `${String(total)} en total` : undefined}>
        {history.isError ? (
          <QueryError error={history.error} fallback="No se pudo cargar el historial." onRetry={() => void history.refetch()} />
        ) : (
          <DataTable
            columns={columns}
            data={history.data?.items ?? []}
            isLoading={history.isPending}
            emptyMessage="Ningún pedido coincide con los filtros."
            getRowId={(order) => String(order.id)}
            renderExpanded={(order) => <OrderSummary order={order} />}
          />
        )}
        {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
      </SectionCard>
    </div>
  )
}
