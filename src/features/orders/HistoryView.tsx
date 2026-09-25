import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { fetchOrders, orderListQueryKey } from '../../api/orders'
import type { OrderResponse } from '../../api/types'
import DataTable, { type DataColumn } from '../../components/DataTable'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import TablePagination from '../../components/TablePagination'
import { Button } from '../../components/ui/button'
import BackLink from './BackLink'
import { formatDateTime, formatMoney, todayIso } from './format'
import HistoryFiltersBar from './history/HistoryFiltersBar'
import { type HistoryFilters, PAGE_SIZE, toParams } from './history/historyFilters'
import OrderSummary from './history/OrderSummary'
import { orderPlace } from './orderLabels'
import OrderStatusBadge from './OrderStatusBadge'
import QueryError from './QueryError'

const COLUMNAS: DataColumn<OrderResponse>[] = [
  { id: 'numero', header: 'N.º', cell: (order) => <span className="font-semibold tabular-nums">#{order.number}</span> },
  { id: 'fecha', header: 'Abierto', cell: (order) => formatDateTime(order.created_at) },
  { id: 'lugar', header: 'Mesa o cliente', cell: (order) => orderPlace(order), className: 'whitespace-normal' },
  { id: 'mesero', header: 'Mesero', cell: (order) => order.waiter_name },
  { id: 'estado', header: 'Estado', cell: (order) => <OrderStatusBadge status={order.status} label={order.status_label} /> },
  { id: 'pago', header: 'Pago', cell: (order) => order.payment_method_label ?? '—' },
  { id: 'total', header: 'Total', cell: (order) => formatMoney(order.total), className: 'text-right tabular-nums' },
  {
    id: 'detalle',
    header: 'Detalle',
    cell: (order, { isExpanded, toggleExpanded }) => (
      <Button
        type="button"
        variant="ghost"
        className="h-10 px-3"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Ocultar' : 'Ver'} el detalle del pedido #${String(order.number)}`}
        onClick={toggleExpanded}
      >
        <Icon name={isExpanded ? 'ocultar' : 'ver'} size={16} />
        <span>{isExpanded ? 'Ocultar' : 'Ver'}</span>
      </Button>
    ),
  },
]

/**
 * El historial de pedidos del encargado, con filtros y el detalle de cada uno.
 *
 * Se pagina en el servidor: un mes de pedidos no entra en una sola respuesta.
 * Arranca en el dia de hoy, que es lo que se revisa al cerrar la caja.
 */
export default function HistoryView() {
  const hoy = todayIso()
  const [filtros, setFiltros] = useState<HistoryFilters>({ from: hoy, to: hoy, status: '', type: '', waiterId: '' })
  const [pagina, setPagina] = useState(0)
  const params = toParams(filtros, pagina)
  const historial = useQuery({
    queryKey: orderListQueryKey(params),
    queryFn: () => fetchOrders(params),
    placeholderData: keepPreviousData,
  })
  const total = historial.data?.total ?? 0
  const paginas = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-5">
      <BackLink to="/tablero" label="Tablero" />
      <PageHeader title="Historial de pedidos" description="Todos los pedidos, cobrados, cancelados o en curso." />
      <SectionCard title="Filtros" as="h2">
        <HistoryFiltersBar
          value={filtros}
          onChange={(nuevos) => {
            setFiltros(nuevos)
            setPagina(0)
          }}
        />
      </SectionCard>
      <SectionCard title="Pedidos" description={historial.isSuccess ? `${String(total)} en total` : undefined}>
        {historial.isError ? (
          <QueryError error={historial.error} fallback="No se pudo cargar el historial." onRetry={() => void historial.refetch()} />
        ) : (
          <DataTable
            columns={COLUMNAS}
            data={historial.data?.items ?? []}
            isLoading={historial.isPending}
            emptyMessage="Ningún pedido coincide con los filtros."
            getRowId={(order) => String(order.id)}
            renderExpanded={(order) => <OrderSummary order={order} />}
          />
        )}
        {paginas > 1 ? <TablePagination actual={pagina} total={paginas} onChange={setPagina} /> : null}
      </SectionCard>
    </div>
  )
}
