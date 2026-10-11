import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { ordersQuery } from '@/api/orders'
import type { OrderResponse } from '@/api/types'
import { DataTable, type DataColumn } from '@/components/DataTable'
import { Icon } from '@/components/Icon'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { TablePagination } from '@/components/TablePagination'
import { Button } from '@/components/ui/button'
import { BackLink } from '@/components/BackLink'
import { HistoryFiltersBar } from './history/HistoryFiltersBar'
import { type HistoryFilters, PAGE_SIZE, toParams } from './history/historyFilters'
import { OrderSummary } from './history/OrderSummary'
import { orderPlace } from './orderLabels'
import { OrderStatusBadge } from './OrderStatusBadge'
import { QueryError } from './QueryError'
import { paths } from '@/services/paths'
import { useTimeZone } from '@/store/session'
import { formatDateTime, formatMoney, todayIn } from '@/services/format'

function buildColumns(timeZone: string): DataColumn<OrderResponse>[] {
  return [

  { id: 'numero', header: 'N.º', cell: (order) => <span className="font-semibold tabular-nums">#{order.number}</span> },
  { id: 'fecha', header: 'Abierto', cell: (order) => formatDateTime(order.created_at, timeZone) },
  { id: 'lugar', header: 'Mesa o cliente', cell: (order) => orderPlace(order), className: 'whitespace-normal' },
  { id: 'mesero', header: 'Mesero', cell: (order) => order.waiter_name },
  { id: 'estado', header: 'Estado', cell: (order) => <OrderStatusBadge status={order.status} /> },
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
        <Icon name={isExpanded ? 'hide' : 'ver'} size={16} />
        <span>{isExpanded ? 'Ocultar' : 'Ver'}</span>
      </Button>
    ),
  },
  ]
}

/**
 * El historial de pedidos del encargado, con filtros y el detalle de cada uno.
 *
 * Se pagina en el servidor: un mes de pedidos no entra en una sola respuesta.
 * Arranca en el dia de hoy, que es lo que se revisa al cerrar la caja.
 */
export function HistoryView() {
  const timeZone = useTimeZone()
  const today = todayIn(timeZone)
  const columns = useMemo(() => buildColumns(timeZone), [timeZone])
  const [filters, setFilters] = useState<HistoryFilters>({ from: today, to: today, status: '', type: '', waiterId: '' })
  const [page, setPage] = useState(0)
  const params = toParams(filters, page)
  const history = useQuery({ ...ordersQuery(params), placeholderData: keepPreviousData })
  const total = history.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-5">
      <BackLink to={paths.board.list} label="Tablero" />
      <PageHeader title="Historial de pedidos" description="Todos los pedidos: pagados, cancelados o en curso." />
      <SectionCard title="Filtros" as="h2">
        <HistoryFiltersBar
          value={filters}
          onChange={(fresh) => {
            setFilters(fresh)
            setPage(0)
          }}
        />
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
