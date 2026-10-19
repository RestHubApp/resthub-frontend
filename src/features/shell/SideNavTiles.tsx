import { AccessibilityButton } from './AccessibilityButton'
import { ConnectionButton } from './connection/ConnectionButton'
import { FullscreenButton } from './FullscreenButton'
import { QuickAppearanceButton } from './quick/QuickAppearanceButton'

/**
 * Los botones cuadrados de 44 px del pie de la barra lateral, en una fila: en
 * una laptop baja, filas completas le quitaban alto al menú.
 *
 * Los cuatro caben en la barra (15rem) con el texto normal; con la letra más
 * grande y la ventana angosta no, y la consulta de contenedor los pasa a dos
 * por fila. Pantalla completa falta donde el navegador no la permite.
 */
export function SideNavTiles() {
  return (
    <div className="@container px-1">
      <div className="grid grid-cols-[repeat(2,2.75rem)] gap-1 @min-[11.75rem]:grid-cols-[repeat(4,2.75rem)]">
        <QuickAppearanceButton variant="tile" />
        <AccessibilityButton />
        <FullscreenButton />
        <ConnectionButton />
      </div>
    </div>
  )
}
