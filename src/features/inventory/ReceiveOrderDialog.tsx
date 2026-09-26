import { useState } from 'react'

import { receivePurchaseOrder } from '../../api/purchasing'
import type { PurchaseOrder } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormDialog from '../../components/FormDialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { formatMoney, formatQuantity } from '../../services/format'
import { usePurchasingMutation } from './usePurchasingMutation'

interface ReceiveOrderDialogProps {
  /** La orden que llegó; `null` cierra la ventana. */
  readonly order: PurchaseOrder | null
  readonly onClose: () => void
}

type Recibido = Readonly<Partial<Record<number, { quantity: string; unitCost: string }>>>

const NUMERO = /^\d+(?:[.,]\d+)?$/u

function inicial(order: PurchaseOrder): Recibido {
  return Object.fromEntries(
    order.lines.map((line) => [line.id, { quantity: line.quantity, unitCost: line.unit_cost }]),
  )
}

/**
 * Recibir la mercadería: cuánto llegó de cada insumo y a qué precio real.
 *
 * Arranca con lo pedido; se corrige lo que llegó distinto. Lo recibido entra
 * al stock como compras y pondera el costo de cada insumo.
 */
export default function ReceiveOrderDialog({ order, onClose }: ReceiveOrderDialogProps) {
  const [recibido, setRecibido] = useState<Recibido | null>(null)
  const recibir = usePurchasingMutation({
    mutationFn: (payload: { orderId: number; lines: { line_id: number; quantity: string; unit_cost: string }[] }) =>
      receivePurchaseOrder(payload.orderId, { lines: payload.lines }),
    success: (orden) => `Orden ${String(orden.number)} recibida: ${formatMoney(orden.received_total)} entraron al stock.`,
    failure: 'No se pudo recibir la orden.',
    onSuccess: () => {
      setRecibido(null)
      onClose()
    },
  })
  if (order === null) {
    return null
  }
  const valores = recibido ?? inicial(order)
  const lineas = order.lines.map((line) => ({
    line_id: line.id,
    quantity: (valores[line.id]?.quantity ?? '0').replace(',', '.'),
    unit_cost: (valores[line.id]?.unitCost ?? '0').replace(',', '.'),
  }))
  const validas = lineas.every((line) => NUMERO.test(line.quantity) && NUMERO.test(line.unit_cost))

  return (
    <FormDialog open title={`Recibir la orden ${String(order.number)}`} description={order.supplier_name} onOpenChange={(abierto) => {
      if (!abierto) {
        setRecibido(null)
        onClose()
      }
    }}>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {order.lines.map((line) => (
          <li key={line.id} className="grid grid-cols-[1fr_7rem_7rem] items-center gap-2 text-sm">
            <span>
              {line.ingredient_name}
              <span className="block text-xs text-muted-foreground">Pedido: {formatQuantity(line.quantity, line.unit ?? '')}</span>
            </span>
            <Input aria-label={`Cantidad recibida de ${line.ingredient_name}`} inputMode="decimal" value={valores[line.id]?.quantity ?? ''} onChange={(evento) => {
              setRecibido({ ...valores, [line.id]: { quantity: evento.target.value, unitCost: valores[line.id]?.unitCost ?? '0' } })
            }} />
            <Input aria-label={`Costo real por unidad de ${line.ingredient_name}`} inputMode="decimal" value={valores[line.id]?.unitCost ?? ''} onChange={(evento) => {
              setRecibido({ ...valores, [line.id]: { quantity: valores[line.id]?.quantity ?? '0', unitCost: evento.target.value } })
            }} />
          </li>
        ))}
      </ul>
      <DialogFormActions>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="success" disabled={!validas || recibir.isPending} onClick={() => {
          recibir.mutate({ orderId: order.id, lines: lineas })
        }}>
          {recibir.isPending ? 'Recibiendo…' : 'Recibir y cargar al stock'}
        </Button>
      </DialogFormActions>
    </FormDialog>
  )
}
