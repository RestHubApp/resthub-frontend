import type { ObsWindow } from '../../../api/types'
import { Button } from '../../../components/ui/button'
import { WINDOWS } from './obsFilters'

interface WindowPickerProps {
  readonly value: ObsWindow
  readonly onChange: (value: ObsWindow) => void
}

/** La ventana que mira el panel: la última hora, 6 h, 24 h o 7 días hasta ahora. */
export default function WindowPicker({ value, onChange }: WindowPickerProps) {
  return (
    <div role="group" aria-labelledby="obs-ventana" className="flex flex-col gap-2">
      <span id="obs-ventana" className="text-sm font-medium">
        Ventana
      </span>
      <div className="flex flex-wrap gap-1">
        {WINDOWS.map((option) => (
          <Button
            key={option.value}
            type="button"
            size="lg"
            variant={option.value === value ? 'default' : 'outline'}
            aria-pressed={option.value === value}
            className="h-11 min-w-14 px-3 tabular-nums"
            onClick={() => {
              onChange(option.value)
            }}
          >
            {option.label}
            <span className="sr-only">{`, ${option.phrase.replace(/^en /u, '')}`}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
