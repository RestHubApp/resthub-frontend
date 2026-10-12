import { stepTextSize, TEXT_SIZES } from '@/services/appearanceRules'
import { useAppearance } from '@/store/appearance'

/**
 * Los ajustes rápidos de apariencia: modo, tamaño del texto y alto contraste.
 *
 * Es lo que comparten la pantalla «Apariencia» y cualquier otro lugar que quiera
 * ofrecerlos sin abrirla (la paleta de comandos, un popover). Cada función cambia
 * una preferencia, se ve al instante y se guarda para la cuenta, igual que en la
 * pantalla completa. No pide permisos: es del dispositivo.
 */
export function useQuickAppearance() {
  const mode = useAppearance((state) => state.appearance.mode)
  const textSize = useAppearance((state) => state.appearance.textSize)
  const contrast = useAppearance((state) => state.appearance.contrast)
  const change = useAppearance((state) => state.change)
  const isHighContrast = contrast === 'high'

  return {
    mode,
    textSize,
    isHighContrast,
    setMode: (next: typeof mode) => {
      change({ mode: next })
    },
    setTextSize: (next: typeof textSize) => {
      change({ textSize: next })
    },
    /** Un paso más chico (A−); en el menor, no hace nada. */
    smaller: () => {
      change({ textSize: stepTextSize(textSize, -1) })
    },
    /** Un paso más grande (A+); en el mayor, no hace nada. */
    larger: () => {
      change({ textSize: stepTextSize(textSize, 1) })
    },
    canSmaller: textSize !== TEXT_SIZES[0].id,
    canLarger: textSize !== TEXT_SIZES.at(-1)?.id,
    toggleHighContrast: () => {
      change({ contrast: isHighContrast ? 'normal' : 'high' })
    },
  }
}
