import { Button } from '@/components/ui/button'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { PRELOAD_QUICK_PALETTE } from './quickPaletteLoader'
import { useQuickPalette } from './quickState'

/** La lupa de la cabecera del celular: la vía principal a la paleta donde no hay teclado. */
export function QuickSearchButton() {
  const open = useQuickPalette((state) => state.open)
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Buscar o ir a…"
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+K Meta+K"
      onClick={open}
      {...PRELOAD_QUICK_PALETTE}
    >
      <Icon glyph={icons.search} size={20} />
    </Button>
  )
}
