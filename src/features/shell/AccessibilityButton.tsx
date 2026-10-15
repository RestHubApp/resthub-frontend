import { openAccessibilityMenu } from '@/components/accessibilityMenu'
import { Button } from '@/components/ui/button'
import { ShellIcon } from './ShellIcon'

const LABEL = 'Accesibilidad'

/** El botón cuadrado «Accesibilidad» del pie de la barra lateral: abre el menú del widget, que con sesión no tiene botón flotante. */
export function AccessibilityButton() {
  return (
    <Button type="button" variant="ghost" size="icon" className="size-11" aria-label={LABEL} title={LABEL} onClick={openAccessibilityMenu}>
      <ShellIcon name="accessibility" size={20} />
    </Button>
  )
}
