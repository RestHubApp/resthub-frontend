import { useState } from 'react'

import { grantCourtesy, revokeCourtesy } from '../../../api/orders'
import type { OrderItemResponse, OrderResponse } from '../../../api/types'
import { MIN_TEXTO } from '../../../components/formRules'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { formatMoney } from '../../../services/format'
import { useOrderAction } from '../useOrderAction'
import { MAX_ADJUSTMENT_REASON } from './discountSchema'

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
export default function CourtesyItem({ order, item }: CourtesyItemProps) {
  const [motivo, setMotivo] = useState<string | null>(null)
  const cambiar = useOrderAction({
    mutationFn: (reason: string | null) =>
      reason === null ? revokeCourtesy(order.id, item.id) : grantCourtesy(order.id, item.id, reason),
    failure: 'No se pudo cambiar la cortesía.',
    onSuccess: () => {
      setMotivo(null)
    },
  })
  const valido = (motivo ?? '').trim().length >= MIN_TEXTO

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
          {item.is_courtesy ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={cambiar.isPending}
              onClick={() => {
                cambiar.mutate(null)
              }}
            >
              Cobrar
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={motivo !== null}
              onClick={() => {
                setMotivo('')
              }}
            >
              <Icon name="cortesia" size={14} />
              <span>Invitar</span>
            </Button>
          )}
        </span>
      </div>
      {motivo === null ? null : (
        <div className="flex gap-2">
          <Input
            aria-label={`Motivo de la cortesía de ${item.name}`}
            placeholder="Error de cocina, cumpleaños…"
            maxLength={MAX_ADJUSTMENT_REASON}
            value={motivo}
            onChange={(evento) => {
              setMotivo(evento.target.value)
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={!valido || cambiar.isPending}
            onClick={() => {
              cambiar.mutate(motivo.trim())
            }}
          >
            Confirmar
          </Button>
        </div>
      )}
    </li>
  )
}
