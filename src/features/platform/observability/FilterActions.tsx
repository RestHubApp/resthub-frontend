import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'

interface FilterActionsProps {
  /** Si hay algún filtro aplicado; sin ninguno no se ofrece quitarlos. */
  readonly active: boolean
  readonly onClear: () => void
}

/** «Buscar» envía el formulario de filtros; «Quitar filtros» vuelve a la lista entera. */
export default function FilterActions({ active, onClear }: FilterActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" size="lg" className="h-11 px-4">
        <Icon name="buscar" size={16} />
        <span>Buscar</span>
      </Button>
      {active ? (
        <Button type="button" variant="ghost" size="lg" className="h-11 px-4" onClick={onClear}>
          <Icon name="cancelar" size={16} />
          <span>Quitar filtros</span>
        </Button>
      ) : null}
    </div>
  )
}
