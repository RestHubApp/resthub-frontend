import { SettingToggle } from '@/components/SettingToggle'
import { useQuickAppearance } from '@/features/shell/useQuickAppearance'

/** El interruptor de alto contraste: aparte del color, porque es una necesidad y no un gusto; se combina con el color elegido. */
export function ContrastToggle() {
  const { isHighContrast, toggleHighContrast } = useQuickAppearance()

  return (
    <SettingToggle
      id="contrast"
      title="Alto contraste"
      detail="Más contraste en textos, bordes y botones, con el color que elegiste."
      isChecked={isHighContrast}
      isPending={false}
      onChange={toggleHighContrast}
    />
  )
}
