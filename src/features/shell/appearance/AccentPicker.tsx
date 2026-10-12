import { ACCENTS, resolveTheme } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { OptionCard } from './OptionCard'

/**
 * El color de acento, en muestras pequeñas. Cada una enseña el color en claro y
 * en oscuro (cada mitad declara su `data-theme`); la descripción solo se ve en la
 * elegida, pero el lector de pantalla la lee en todas. Con alto contraste las
 * muestras enseñan el color con ese contraste.
 */
export function AccentPicker() {
  const accent = useAppearance((state) => state.appearance.accent)
  const contrast = useAppearance((state) => state.appearance.contrast)
  const change = useAppearance((state) => state.change)

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Color de acento</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACCENTS.map((option) => (
          <OptionCard
            key={option.id}
            name="accent"
            value={option.id}
            label={option.label}
            description={option.description}
            isChecked={accent === option.id}
            onSelect={() => {
              change({ accent: option.id })
            }}
          >
            <span aria-hidden="true" className="flex h-9 w-14 overflow-hidden rounded-full border">
              <span data-theme={resolveTheme({ mode: 'light', accent: option.id, contrast }, false)} className="flex flex-1 items-center justify-center bg-background">
                <span className="size-4 rounded-full bg-primary" />
              </span>
              <span data-theme={resolveTheme({ mode: 'dark', accent: option.id, contrast }, true)} className="flex flex-1 items-center justify-center bg-background">
                <span className="size-4 rounded-full bg-primary" />
              </span>
            </span>
          </OptionCard>
        ))}
      </div>
    </fieldset>
  )
}
