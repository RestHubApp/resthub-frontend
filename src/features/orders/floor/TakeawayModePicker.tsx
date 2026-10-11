import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import type { TakeawayValues } from './takeawaySchema'

type TakeawayMode = TakeawayValues['mode']

interface TakeawayModePickerProps {
  readonly value: TakeawayMode
  readonly onChange: (mode: TakeawayMode) => void
}

const MODES: readonly { value: TakeawayMode; label: string }[] = [
  { value: 'takeaway', label: 'Recoge en local' },
  { value: 'delivery', label: 'Delivery' },
]

/** Elegir cómo se entrega el pedido: recoge en el local o delivery. */
export function TakeawayModePicker({ value, onChange }: TakeawayModePickerProps) {
  return (
    <div role="radiogroup" aria-label="Cómo se entrega" className="grid grid-cols-2 gap-2">
      {MODES.map((modeOption) => (
        <Button
          key={modeOption.value}
          type="button"
          role="radio"
          aria-checked={value === modeOption.value}
          variant={value === modeOption.value ? 'default' : 'outline'}
          size="lg"
          className="h-11"
          onClick={() => {
            onChange(modeOption.value)
          }}
        >
          <Icon name={modeOption.value === 'delivery' ? 'delivery' : 'takeaway'} size={16} />
          <span>{modeOption.label}</span>
        </Button>
      ))}
    </div>
  )
}
