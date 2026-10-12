import { TEXT_SIZES } from '@/services/appearanceRules'
import { OptionCard } from './OptionCard'
import { useQuickAppearance } from './useQuickAppearance'

const SAMPLE_SIZE = { normal: 'text-base', large: 'text-lg', larger: 'text-xl', largest: 'text-2xl' } as const

/** El tamaño del texto de toda la aplicación, de 100 a 150 %: el único control de tamaño de RestHub. */
export function TextSizePicker() {
  const { textSize, setTextSize } = useQuickAppearance()

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Tamaño del texto</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TEXT_SIZES.map((option) => (
          <OptionCard
            key={option.id}
            name="text-size"
            value={option.id}
            label={`${option.label} (${option.percent})`}
            isChecked={textSize === option.id}
            onSelect={() => {
              setTextSize(option.id)
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
