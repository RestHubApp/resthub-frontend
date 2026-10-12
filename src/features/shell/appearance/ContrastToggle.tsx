import { SettingToggle } from '@/components/SettingToggle'
import { useQuickAppearance } from '@/features/shell/useQuickAppearance'

/** El interruptor de alto contraste: aparte del color, porque es una necesidad y no un gusto. */
export function ContrastToggle() {
  const { isHighContrast, toggleHighContrast } = useQuickAppearance()

  return (
    <SettingToggle
      id="contrast"
      title="Alto contraste"
      detail="Blanco y negro firmes, para leer sin esfuerzo. Mientras esté activo, reemplaza el color de acento."
      isChecked={isHighContrast}
      isPending={false}
      onChange={toggleHighContrast}
    />
  )
}
