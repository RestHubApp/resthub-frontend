import type { ThemeId } from '@/services/appearanceRules'
import { ThemeMiniature } from './ThemeMiniature'

interface ThemeSampleProps {
  /** Un tema, o dos para «Según el sistema»: se ven lado a lado. */
  readonly themes: readonly ThemeId[]
}

/**
 * La muestra de un tema en la tarjeta que lo elige.
 *
 * Cada miniatura declara su `data-theme`, así se ve el tema sin aplicarlo a la
 * página. Es decorativa: el nombre y la descripción de la tarjeta lo dicen.
 */
export function ThemeSample({ themes }: ThemeSampleProps) {
  return (
    <div aria-hidden="true" className="flex overflow-hidden rounded-lg border">
      {themes.map((theme) => (
        <ThemeMiniature key={theme} theme={theme} />
      ))}
    </div>
  )
}
