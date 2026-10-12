import { TEXT_SIZES } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { OptionCard } from './OptionCard'

const SAMPLE_SIZE = { normal: 'text-base', large: 'text-xl', larger: 'text-2xl' } as const

/** El tamaño del texto de toda la aplicación: normal, grande o muy grande. */
export function TextSizePicker() {
  const textSize = useAppearance((state) => state.appearance.textSize)
  const change = useAppearance((state) => state.change)

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Tamaño del texto</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {TEXT_SIZES.map((option) => (
          <OptionCard
            key={option.id}
            name="text-size"
            value={option.id}
            label={option.label}
            isChecked={textSize === option.id}
            onSelect={() => {
              change({ textSize: option.id })
            }}
          >
            <span aria-hidden="true" className={`font-semibold text-foreground ${SAMPLE_SIZE[option.id]}`}>
              Aa
            </span>
          </OptionCard>
        ))}
      </div>
    </fieldset>
  )
}
