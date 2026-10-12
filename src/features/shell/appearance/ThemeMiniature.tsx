import type { ThemeId } from '@/services/appearanceRules'

interface ThemeMiniatureProps {
  readonly theme: ThemeId
}

/** Una pantalla en miniatura pintada con los colores de un tema. */
export function ThemeMiniature({ theme }: ThemeMiniatureProps) {
  return (
    // `data-theme` le da los colores de ese tema aunque la página use otro (ver `index.css`).
    <div data-theme={theme} className="flex h-24 min-w-0 flex-1 bg-background text-foreground">
      <div className="flex w-1/4 flex-col gap-1.5 border-r border-sidebar-border bg-sidebar p-2">
        <span className="h-2 rounded-sm bg-sidebar-primary" />
        <span className="h-2 rounded-sm bg-sidebar-accent" />
        <span className="h-2 rounded-sm bg-sidebar-accent" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2">
        <span className="h-2.5 w-2/3 rounded-sm bg-foreground" />
        <span className="h-2 w-full rounded-sm bg-muted-foreground" />
        <span className="h-2 w-4/5 rounded-sm bg-muted" />
        <span className="mt-auto flex items-center gap-1.5">
          <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">Cobrar</span>
          <span className="size-3 rounded-full border border-input bg-card" />
        </span>
      </div>
    </div>
  )
}
