import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { activeOrdersQueryKey, fetchActiveOrders } from '../../api/orders'
import type { OrderResponse, OrderStatus } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import PageHeader from '../../components/PageHeader'
import { Button } from '../../components/ui/button'
import { useOrderNoteFlags } from '../../hooks/useOrderNoteFlags'
import { useCan } from '../../store/session'
import BoardColumn from './board/BoardColumn'
import TypeFilter, { type TypeFilterValue } from './board/TypeFilter'
import CancelOrderDialog from './CancelOrderDialog'
import ChargeDialog from './charge/ChargeDialog'
import LiveIndicator from './LiveIndicator'
import QueryError from './QueryError'
import { useLiveUpdates } from './useLiveUpdates'
import { useNow } from './useNow'

const COLUMNAS: readonly { status: OrderStatus; title: string }[] = [
  { status: 'open', title: 'Abierto' },
  { status: 'in_kitchen', title: 'En cocina' },
  { status: 'ready', title: 'Listo' },
  { status: 'served', title: 'Servido, por cobrar' },
]

function contar(orders: readonly OrderResponse[]): Record<TypeFilterValue, number> {
  const enMesa = orders.filter((order) => order.type === 'dine_in').length
  return { all: orders.length, dine_in: enMesa, takeaway: orders.length - enMesa }
}

/**
 * El tablero del encargado: los pedidos del dia en vivo, de la cocina a la caja.
 *
 * Una columna por estado. Los pedidos llegan y se mueven solos con los avisos
 * del servidor. Las ventanas de cobro y cancelacion viven aca y no en cada
 * tarjeta: al cobrar, la tarjeta sale del tablero y el vuelto sigue a la vista.
 */
export default function BoardView() {
  const live = useLiveUpdates()
  const now = useNow()
  const activos = useQuery({ queryKey: activeOrdersQueryKey, queryFn: fetchActiveOrders })
  const [tipo, setTipo] = useState<TypeFilterValue>('all')
  const [cobrar, setCobrar] = useState<OrderResponse | null>(null)
  const [cancelar, setCancelar] = useState<OrderResponse | null>(null)
  const pedidos = useMemo(() => activos.data ?? [], [activos.data])
  const ids = useMemo(() => pedidos.map((order) => order.id), [pedidos])
  // El tablero ya escucha el canal de avisos: el tema `insights` refresca las
  // notas desde useLiveUpdates y no hace falta una segunda conexión.
  const veAlergias = useCan('insights.read')
  const notas = useOrderNoteFlags(ids, { enabled: veAlergias, live: false })
  const visibles = tipo === 'all' ? pedidos : pedidos.filter((order) => order.type === tipo)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Tablero"
        description="Los pedidos en curso, del más antiguo al más nuevo."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <LiveIndicator status={live} />
            <Button asChild variant="outline" size="lg" className="h-11 px-4">
              <Link to="/tablero/historial">
                <Icon name="historial" size={18} />
                <span>Historial</span>
              </Link>
            </Button>
          </div>
        }
      />
      <TypeFilter value={tipo} counts={contar(pedidos)} onChange={setTipo} />
      {activos.isPending ? <EmptyState title="Cargando pedidos…" /> : null}
      {activos.isError ? (
        <QueryError error={activos.error} fallback="No se pudieron cargar los pedidos." onRetry={() => void activos.refetch()} />
      ) : null}
      {activos.isSuccess ? (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNAS.map((columna) => (
            <BoardColumn
              key={columna.status}
              title={columna.title}
              orders={visibles.filter((order) => order.status === columna.status)}
              now={now}
              flagFor={notas.flagFor}
              onCharge={setCobrar}
              onCancel={setCancelar}
            />
          ))}
        </div>
      ) : null}
      <ChargeDialog order={cobrar} onClose={() => {
        setCobrar(null)
      }} />
      <CancelOrderDialog order={cancelar} onClose={() => {
        setCancelar(null)
      }} />
    </div>
  )
}
