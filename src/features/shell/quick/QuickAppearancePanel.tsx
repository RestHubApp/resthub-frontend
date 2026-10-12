import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { useQuickAppearance } from '@/features/shell/useQuickAppearance'
import { MODES, TEXT_SIZES } from '@/services/appearanceRules'
import { paths } from '@/services/paths'
import { QuickModeSegments } from './QuickModeSegments'

/**
 * El contenido de «Apariencia rápida»: modo, tamaño del texto y alto contraste.
 *
 * No guarda nada por su cuenta: usa `useQuickAppearance`, el mismo almacén que
 * la pantalla «Apariencia» y que la paleta. Cada cambio se ve al instante.
 */
export function QuickAppearancePanel({ onNavigate }: { readonly onNavigate: () => void }) {
  const quick = useQuickAppearance()
  const size = TEXT_SIZES.find((option) => option.id === quick.textSize)

  return (
    <div className="flex flex-col gap-4">
      <QuickModeSegments modes={MODES} mode={quick.mode} onChange={quick.setMode} />

      <div className="flex flex-col gap-2">
        <p className="m-0 text-sm font-medium">Texto</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" aria-label="Texto más pequeño" disabled={!quick.canSmaller} onClick={quick.smaller}>
            <span aria-hidden="true">A−</span>
          </Button>
          <p role="status" className="m-0 min-w-0 flex-1 text-center text-sm">
            {size === undefined ? '' : `${size.label} (${size.percent})`}
          </p>
          <Button type="button" variant="outline" size="icon" aria-label="Texto más grande" disabled={!quick.canLarger} onClick={quick.larger}>
            <span aria-hidden="true">A+</span>
          </Button>
        </div>
      </div>

      <Button type="button" variant="outline" aria-pressed={quick.isHighContrast} className="justify-between" onClick={quick.toggleHighContrast}>
        <span>Alto contraste</span>
        <span className="font-semibold">{quick.isHighContrast ? 'Activado' : 'Desactivado'}</span>
      </Button>

      <Button asChild variant="ghost" className="justify-start px-3">
        <Link to={paths.appearance} onClick={onNavigate}>
          Más ajustes de apariencia
        </Link>
      </Button>
    </div>
  )
}
