import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { changePurchaseOrder, purchaseOrdersQuery } from '../../api/purchasing'
import type { PurchaseOrder } from '../../api/types'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import ListSkeleton from '../../components/ListSkeleton'
import SectionCard from '../../components/SectionCard'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { formatDateTime, formatMoney } from '../../services/format'
import { useTimeZone } from '../../store/session'
import PurchaseOrderDialog from './PurchaseOrderDialog'
import ReceiveOrderDialog from './ReceiveOrderDialog'
import { usePurchasingMutation } from './usePurchasingMutation'

interface PurchaseOrdersPanelProps {
  readonly canManage: boolean
}

const TONO: Record<PurchaseOrder['status'], string> = {
  draft: 'bg-muted text-foreground',
  sent: 'bg-primary/10 text-primary',
  received: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
}

/**
 * Las órdenes de compra: borrador, enviada, recibida o cancelada.
 *
 * Recibir una orden es lo que la vuelve stock: cada insumo que llegó entra al
 * libro como compra, con su costo real.
 */
export default function PurchaseOrdersPanel({ canManage }: PurchaseOrdersPanelProps) {
  const timeZone = useTimeZone()
  const ordenes = useQuery(purchaseOrdersQuery)
  const [creando, setCreando] = useState(false)
  const [recibiendo, setRecibiendo] = useState<PurchaseOrder | null>(null)
  const cambiar = usePurchasingMutation({
    mutationFn: (payload: { id: number; action: 'send' | 'cancel' }) => changePurchaseOrder(payload.id, payload.action),
    success: (orden) => `Orden ${String(orden.number)}: ${orden.status_label.toLowerCase()}.`,
    failure: 'No se pudo cambiar la orden.',
  })
  const lista = ordenes.data?.items ?? []

  return (
    <SectionCard
      title="Órdenes de compra"
      actions={canManage ? (
        <Button type="button" onClick={() => {
          setCreando(true)
        }}>
          <Icon name="agregar" size={16} />
          <span>Nueva orden</span>
        </Button>
      ) : undefined}
    >
      {ordenes.isPending ? <ListSkeleton label="Cargando órdenes…" count={3} itemClassName="h-16 rounded-lg" /> : null}
      {ordenes.isError ? <FormMessage tone="error">{errorMessage(ordenes.error, 'No se pudieron cargar las órdenes.')}</FormMessage> : null}
      {ordenes.isSuccess && lista.length === 0 ? (
        <EmptyState title="Todavía no hay órdenes de compra" description="Arma una con lo que se está acabando." />
      ) : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {lista.map((orden) => (
          <li key={orden.id} className="flex flex-col gap-2 rounded-lg p-3 ring-1 ring-input">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">OC {orden.number} · {orden.supplier_name}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONO[orden.status]}`}>{orden.status_label}</span>
            </div>
            <p className="m-0 text-sm text-muted-foreground">
              {orden.lines.map((line) => line.ingredient_name).join(', ')} · {formatDateTime(orden.created_at, timeZone)}
            </p>
            <p className="m-0 text-sm">
              Estimado {formatMoney(orden.estimated_total)}
              {orden.status === 'received' ? ` · Recibido ${formatMoney(orden.received_total)}` : ''}
            </p>
            {canManage && (orden.status === 'draft' || orden.status === 'sent') ? (
              <div className="flex flex-wrap gap-2">
                {orden.status === 'draft' ? (
                  <Button type="button" size="sm" variant="outline" disabled={cambiar.isPending} onClick={() => {
                    cambiar.mutate({ id: orden.id, action: 'send' })
                  }}>
                    <Icon name="enviar" size={14} />
                    <span>Marcar enviada</span>
                  </Button>
                ) : null}
                <Button type="button" size="sm" variant="success" onClick={() => {
                  setRecibiendo(orden)
                }}>
                  <Icon name="compra" size={14} />
                  <span>Recibir</span>
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={cambiar.isPending} onClick={() => {
                  cambiar.mutate({ id: orden.id, action: 'cancel' })
                }}>
                  Cancelar
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      <PurchaseOrderDialog open={creando} onClose={() => {
        setCreando(false)
      }} />
      <ReceiveOrderDialog order={recibiendo} onClose={() => {
        setRecibiendo(null)
      }} />
    </SectionCard>
  )
}
