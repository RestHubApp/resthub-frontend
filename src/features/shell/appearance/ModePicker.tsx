import { Icon } from '@/components/Icon'
import type { IconName } from '@/components/icons'
import { MODES, resolveTheme } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'
import { OptionCard } from './OptionCard'
import { ThemeChip } from './ThemeChip'
import { useQuickAppearance } from './useQuickAppearance'

const MODE_ICON: Record<(typeof MODES)[number]['id'], IconName> = {
  light: 'lightMode',
  dark: 'darkMode',
  system: 'deviceMode',
}

/** Claro, oscuro o automático, cada uno con una muestra de cómo queda con el color elegido. */
export function ModePicker() {
  const { mode, setMode } = useQuickAppearance()
  const accent = useAppearance((state) => state.appearance.accent)
  const contrast = useAppearance((state) => state.appearance.contrast)
  const light = resolveTheme({ mode: 'light', accent, contrast }, false)
  const dark = resolveTheme({ mode: 'dark', accent, contrast }, true)

  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Modo</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {MODES.map((option) => (
          <OptionCard
            key={option.id}
            name="mode"
            value={option.id}
            label={option.label}
            layout="inline"
            isChecked={mode === option.id}
            onSelect={() => {
              setMode(option.id)
            }}
          >
            <span aria-hidden="true" className="flex shrink-0 items-center gap-1">
              {option.id === 'system' ? (
                <>
                  <ThemeChip theme={light} />
                  <ThemeChip theme={dark} />
                </>
              ) : (
                <ThemeChip theme={option.id === 'dark' ? dark : light} />
              )}
              <Icon name={MODE_ICON[option.id]} size={16} className="text-muted-foreground" />
            </span>
          </OptionCard>
        ))}
      </div>
    </fieldset>
  )
}
