import type { ThemeId } from '@/services/appearanceRules'

interface ThemeChipProps {
  readonly theme: ThemeId
}

/** Un cuadrito con el fondo y el color de un tema, sin aplicarlo a la página (cada uno declara su `data-theme`). */
export function ThemeChip({ theme }: ThemeChipProps) {
  return (
    <span data-theme={theme} className="flex size-9 items-center justify-center rounded-lg border bg-background text-foreground">
      <span className="size-3.5 rounded-full bg-primary" />
    </span>
  )
}

