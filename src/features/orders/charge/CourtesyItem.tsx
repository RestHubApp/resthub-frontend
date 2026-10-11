import { useState } from 'react'

import { grantCourtesy, revokeCourtesy } from '@/api/orders'
import type { OrderItemResponse, OrderResponse } from '@/api/types'
import { MIN_TEXT } from '@/components/formRules'
import { formatMoney } from '@/services/format'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { CourtesyActions } from './CourtesyActions'
import { CourtesyReason } from './CourtesyReason'

interface CourtesyItemProps {
  readonly order: OrderResponse
  readonly item: OrderItemResponse
}

/**
 * Un plato con la opción de invitarlo (la casa no lo cobra) o de volver a cobrarlo.
 *
 * El motivo se escribe ahí mismo: es una línea, y abrir otra ventana encima
 * del cobro perdería de vista la cuenta.
 */
export function CourtesyItem({ order, item }: CourtesyItemProps) {
  const [reason, setReason] = useState<string | null>(null)
  const change = useOrderAction({
    mutationFn: (reason: string | null) =>
      reason === null ? revokeCourtesy(order.id, item.id) : grantCourtesy(order.id, item.id, reason),
    failure: 'No se pudo cambiar la cortesía.',
    onSuccess: () => {
      setReason(null)
    },
  })
  const isValid = (reason ?? '').trim().length >= MIN_TEXT

  return (
    <li className="flex flex-col gap-2 rounded-md px-3 py-2 ring-1 ring-input">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>
          {item.quantity} × {item.name}
          {item.is_courtesy ? (
            <span className="ml-2 text-xs text-success">Invita la casa: {item.courtesy_reason}</span>
          ) : null}
        </span>
        <span className="flex items-center gap-2">
          <span className="tabular-nums">{formatMoney(item.subtotal)}</span>
          <CourtesyActions
            item={item}
            isPending={change.isPending}
            isReasonOpen={reason !== null}
            onRevoke={() => {
              change.mutate(null)
            }}
            onInvite={() => {
              setReason('')
            }}
          />
        </span>
      </div>
      {reason === null ? null : (
        <CourtesyReason
          itemName={item.name}
          value={reason}
          isConfirmDisabled={!isValid || change.isPending}
          onChange={setReason}
          onConfirm={() => {
            change.mutate(reason.trim())
          }}
        />
      )}
    </li>
  )
}
