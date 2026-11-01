import { openAccessibilityMenu } from '@/components/accessibilityMenu'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'

// Lo que tarda en cerrarse el panel (la animación de `sheet`).
const SHEET_CLOSE_MS = 350

interface MoreAccessibilityItemProps {
  /** Cierra el panel «Más» antes de abrir el menú del widget. */
  readonly onClose: () => void
}

/** La fila «Accesibilidad» del panel «Más»: cierra el panel y abre el menú del widget. */
export function MoreAccessibilityItem({ onClose }: MoreAccessibilityItemProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="justify-start gap-3 px-3"
      onClick={() => {
        onClose()
        // El menú del widget se abre cuando el panel ya soltó el foco.
        window.setTimeout(openAccessibilityMenu, SHEET_CLOSE_MS)
      }}
    >
      <Icon glyph={icons.accessibility} size={18} />
      <span>Accesibilidad</span>
    </Button>
  )
}
