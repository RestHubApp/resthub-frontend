import type { MODES } from '@/services/appearanceRules'

const SEGMENT =
  'flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-md px-2 text-center text-sm font-medium transition-colors hover:bg-muted has-checked:bg-primary has-checked:text-primary-foreground has-checked:hover:bg-primary has-focus-visible:ring-3 has-focus-visible:ring-ring/50'

const SHORT_LABEL = { light: 'Claro', dark: 'Oscuro', system: 'Automático' } as const

interface QuickModeSegmentsProps {
  readonly modes: typeof MODES
  readonly mode: (typeof MODES)[number]['id']
  readonly onChange: (mode: (typeof MODES)[number]['id']) => void
}

/** Claro, oscuro o automático como botones de radio en una tira (patrón de grupo de radio de la APG). */
export function QuickModeSegments({ modes, mode, onChange }: QuickModeSegmentsProps) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-sm font-medium">Modo</legend>
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {modes.map((option) => (
          <label key={option.id} className={SEGMENT}>
            <input
              type="radio"
              name="quick-mode"
              value={option.id}
              checked={mode === option.id}
              onChange={() => {
                onChange(option.id)
              }}
              className="sr-only"
            />
            <span>{SHORT_LABEL[option.id]}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
