import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'

interface SuggestionsBarProps {
  /** Cuántos insumos sugiere el sistema; sin ninguno, el botón se bloquea. */
  readonly count: number
  readonly onLoad: () => void
}

/** El encabezado de los insumos de la orden, con «Cargar sugerencias». */
export function SuggestionsBar({ count, onLoad }: SuggestionsBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-medium">Insumos</span>
      <Button type="button" variant="outline" size="sm" disabled={count === 0} onClick={onLoad}>
        <Icon glyph={icons.buy} size={14} />
        <span>Cargar sugerencias ({count})</span>
      </Button>
    </div>
  )
}
