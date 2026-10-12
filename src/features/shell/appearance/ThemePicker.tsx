import { SYSTEM_DARK_THEME, SYSTEM_LIGHT_THEME, SYSTEM_THEME, THEMES } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { OptionCard } from './OptionCard'
import { ThemeSample } from './ThemeSample'

/** Los temas de colores, con una muestra de cada uno y «Según el sistema». */
export function ThemePicker() {
  const theme = useAppearance((state) => state.appearance.theme)
  const change = useAppearance((state) => state.change)

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Tema de colores</legend>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {THEMES.map((option) => (
          <OptionCard
            key={option.id}
            name="theme"
            value={option.id}
            label={option.label}
            description={option.description}
            isChecked={theme === option.id}
            onSelect={() => {
              change({ theme: option.id })
            }}
          >
            <ThemeSample themes={[option.id]} />
          </OptionCard>
        ))}
        <OptionCard
          name="theme"
          value={SYSTEM_THEME}
          label="Según el sistema"
          description="Claro de día y oscuro de noche, como tengas el aparato."
          isChecked={theme === SYSTEM_THEME}
          onSelect={() => {
            change({ theme: SYSTEM_THEME })
          }}
        >
          <ThemeSample themes={[SYSTEM_LIGHT_THEME, SYSTEM_DARK_THEME]} />
        </OptionCard>
      </div>
    </fieldset>
  )
}
