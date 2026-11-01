import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { purchaseOrdersQuery } from '@/api/purchasing'
import type { PurchaseOrder } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { PurchaseOrderDialog } from './PurchaseOrderDialog'
import { PurchaseOrdersList } from './PurchaseOrdersList'
import { ReceiveOrderDialog } from './ReceiveOrderDialog'
import { usePurchaseOrderChange } from './usePurchaseOrderChange'

interface PurchaseOrdersPanelProps {
  readonly canManage: boolean
}

/**
 * Las órdenes de compra: borrador, enviada, recibida o cancelada.
 *
 * Recibir una orden es lo que la vuelve stock: cada insumo que llegó entra al
 * libro como compra, con su costo real.
 */
export function PurchaseOrdersPanel({ canManage }: PurchaseOrdersPanelProps) {
  const orders = useQuery(purchaseOrdersQuery)
  const [isCreating, setIsCreating] = useState(false)
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null)
  const change = usePurchaseOrderChange()

  return (
    <SectionCard
      title="Órdenes de compra"
      actions={canManage ? (
        <Button type="button" onClick={() => {
          setIsCreating(true)
        }}>
          <Icon glyph={icons.add} size={16} />
          <span>Nueva orden</span>
        </Button>
      ) : undefined}
    >
      <PurchaseOrdersList
        status={orders.status}
        error={orders.error}
        orders={orders.data?.items ?? []}
        canManage={canManage}
        isBusy={change.isPending}
        onChange={(id, action) => {
          change.mutate({ id, action })
        }}
        onReceive={setReceiving}
      />
      <PurchaseOrderDialog open={isCreating} onClose={() => {
        setIsCreating(false)
      }} />
      <ReceiveOrderDialog order={receiving} onClose={() => {
        setReceiving(null)
      }} />
    </SectionCard>
  )
}
