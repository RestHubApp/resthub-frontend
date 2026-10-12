import { openAccessibilityMenu } from '@/components/accessibilityMenu'
import { Button } from '@/components/ui/button'
import { ShellIcon } from './ShellIcon'

/** La fila «Accesibilidad» de la barra lateral: abre el menú del widget, que con sesión no tiene botón flotante. */
export function AccessibilityRow() {
  return (
    <Button type="button" variant="ghost" className="justify-start gap-3 px-3" onClick={openAccessibilityMenu}>
      <ShellIcon name="accessibility" size={18} />
      <span>Accesibilidad</span>
    </Button>
  )
}
