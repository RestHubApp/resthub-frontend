import type { OrderResponse } from '../../../api/types'
import { Checkbox } from '../../../components/ui/checkbox'
import { formatCents, formatMoney } from '../../../services/format'
import { unpaidItems } from './chargeMath'

interface ItemSplitPickerProps {
  readonly order: OrderResponse
  readonly selected: readonly number[]
  readonly chargeCents: number
  readonly onChange: (itemIds: number[]) => void
}

/**
 * Los platos que paga esta persona. Los ya pagados no aparecen.
 *
 * El monto lo confirma el servidor: acá se muestra con el descuento del
 * pedido ya aplicado, igual que lo va a calcular.
 */
export default function ItemSplitPicker({ order, selected, chargeCents, onChange }: ItemSplitPickerProps) {
  const pendientes = unpaidItems(order)
  const toggle = (itemId: number, marcado: boolean) => {
    onChange(marcado ? [...selected, itemId] : selected.filter((id) => id !== itemId))
  }

  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-sm font-medium">Platos que paga</legend>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {pendientes.map((item) => (
          <li key={item.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 ring-1 ring-input has-checked:bg-muted">
              <Checkbox
                checked={selected.includes(item.id)}
                onCheckedChange={(estado) => {
                  toggle(item.id, estado === true)
                }}
              />
              <span className="flex-1 text-sm">
                {item.quantity} × {item.name}
                {item.is_courtesy ? <span className="ml-2 text-xs text-muted-foreground">(cortesía)</span> : null}
              </span>
              <span className="text-sm tabular-nums">{item.is_courtesy ? '—' : formatMoney(item.subtotal)}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="m-0 flex items-baseline justify-between px-1 text-sm">
        <span className="text-muted-foreground">
          {selected.length === 0 ? 'Elige al menos un plato' : 'Paga, con el descuento del pedido'}
        </span>
        <span className="text-lg font-bold tabular-nums">{formatCents(chargeCents)}</span>
      </p>
    </fieldset>
  )
}
