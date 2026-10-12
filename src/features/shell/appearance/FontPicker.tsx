import { FONTS } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { OptionCard } from './OptionCard'

/** Las letras, cada una escrita con ella misma para que se vea la diferencia. */
export function FontPicker() {
  const font = useAppearance((state) => state.appearance.font)
  const change = useAppearance((state) => state.change)

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Tipo de letra</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {FONTS.map((option) => (
          <OptionCard
            key={option.id}
            name="font"
            value={option.id}
            label={option.label}
            description={option.description}
            isChecked={font === option.id}
            onSelect={() => {
              change({ font: option.id })
            }}
          >
            {/* `data-font` da a la muestra su letra aunque la página use otra (ver `index.css`). */}
            <p aria-hidden="true" data-font={option.id} className="m-0 font-sans text-lg leading-snug text-foreground">
              Ají de gallina, ñoquis y 1 234,50
            </p>
          </OptionCard>
        ))}
      </div>
    </fieldset>
  )
}
