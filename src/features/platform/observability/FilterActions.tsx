import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'

interface FilterActionsProps {
  /** Si hay algún filtro aplicado; sin ninguno no se ofrece quitarlos. */
  readonly active: boolean
  readonly onClear: () => void
}

/** «Buscar» envía el formulario de filtros; «Quitar filtros» vuelve a la lista entera. */
export function FilterActions({ active, onClear }: FilterActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit">
        <Icon name="search" size={16} />
        <span>Buscar</span>
      </Button>
      {active ? (
        <Button type="button" variant="ghost" onClick={onClear}>
          <Icon name="cancel" size={16} />
          <span>Quitar filtros</span>
        </Button>
      ) : null}
    </div>
  )
}
