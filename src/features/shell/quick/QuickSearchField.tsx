import { ShellIcon } from '@/features/shell/ShellIcon'
import { PRELOAD_QUICK_PALETTE } from './quickPaletteLoader'
import { useQuickPalette } from './quickState'

/** «Ctrl K» o «⌘K» según el sistema de quien mira. */
function shortcutLabel(): string {
  return /mac|iphone|ipad/iu.test(navigator.userAgent) ? '⌘K' : 'Ctrl K'
}

/** El campo «Buscar o ir a…» de la barra lateral: un botón con aspecto de campo y la insignia del atajo. */
export function QuickSearchField() {
  const open = useQuickPalette((state) => state.open)
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+K Meta+K"
      onClick={open}
      {...PRELOAD_QUICK_PALETTE}
      className="flex h-(--control-h) w-full items-center gap-2 rounded-lg border bg-background px-3 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ShellIcon name="search" size={16} />
      <span className="min-w-0 flex-1 truncate">Buscar o ir a…</span>
      <kbd aria-hidden="true" className="rounded border bg-muted px-1.5 py-0.5 font-sans text-xs">
        {shortcutLabel()}
      </kbd>
    </button>
  )
}
