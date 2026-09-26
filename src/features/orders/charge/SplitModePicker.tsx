import type { SplitMode } from './chargeMath'

interface SplitModePickerProps {
  readonly value: SplitMode
  readonly onChange: (mode: SplitMode) => void
}

const MODOS: readonly { value: SplitMode; label: string }[] = [
  { value: 'all', label: 'Todo junto' },
  { value: 'equal', label: 'Partes iguales' },
  { value: 'items', label: 'Por platos' },
]

/**
 * Cómo se paga la cuenta: toda junta, en partes iguales o cada uno lo suyo.
 *
 * Radios nativos con el aspecto de fichas: se recorren con las flechas y el
 * lector de pantalla dice cuál está elegida.
 */
export default function SplitModePicker({ value, onChange }: SplitModePickerProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-sm font-medium">Cómo pagan</legend>
      <div className="grid grid-cols-3 gap-2">
        {MODOS.map((modo) => (
          <label
            key={modo.value}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-2 text-center text-sm font-semibold ring-1 ring-input transition-colors hover:bg-muted has-checked:bg-primary has-checked:text-primary-foreground has-checked:ring-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
          >
            <input
              type="radio"
              name="modo-de-pago"
              value={modo.value}
              checked={value === modo.value}
              className="sr-only"
              onChange={() => {
                onChange(modo.value)
              }}
            />
            {modo.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
