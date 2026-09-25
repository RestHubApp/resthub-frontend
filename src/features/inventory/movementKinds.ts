import type { MovementKind } from '../../api/types'
import type { StatusTone } from '../../components/StatusBadge'

/** Los tipos de movimiento, en el orden del filtro. El servidor manda el mismo texto en `kind_label`. */
export const KIND_OPTIONS: readonly { readonly value: MovementKind; readonly label: string }[] = [
  { value: 'purchase', label: 'Compra' },
  { value: 'consumption', label: 'Consumo' },
  { value: 'waste', label: 'Merma' },
  { value: 'adjustment', label: 'Ajuste' },
]

// Lo que suma en verde, lo que se pierde en rojo; el consumo de los pedidos es
// lo normal y va neutro.
export const KIND_TONES: Record<MovementKind, StatusTone | undefined> = {
  purchase: 'completed',
  consumption: undefined,
  waste: 'cancelled',
  adjustment: 'confirmed',
}
