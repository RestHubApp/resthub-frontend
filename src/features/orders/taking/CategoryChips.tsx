import type { OrderMenuSection } from '../../../api/types'

interface CategoryChipsProps {
  readonly sections: readonly OrderMenuSection[]
  /** `null` muestra la carta entera. */
  readonly selected: number | null
  readonly onSelect: (categoryId: number | null) => void
}

const CHIP =
  'min-h-11 shrink-0 rounded-full px-4 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50'
const ACTIVE = `${CHIP} bg-primary text-primary-foreground`
const IDLE = `${CHIP} bg-card text-foreground ring-1 ring-foreground/15 hover:bg-muted`

/**
 * Las categorias como fichas que se deslizan de costado.
 *
 * Son botones con `aria-pressed` y no pestanas: filtran una sola lista, y asi
 * el lector de pantalla dice cual esta elegida sin prometer paneles.
 */
export default function CategoryChips({ sections, selected, onSelect }: CategoryChipsProps) {
  const opciones = [{ id: null, name: 'Toda la carta' }, ...sections.map(({ id, name }) => ({ id, name }))]

  return (
    <div
      role="group"
      aria-label="Categorías"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {opciones.map((opcion) => (
        <button
          key={opcion.id ?? 'carta'}
          type="button"
          aria-pressed={selected === opcion.id}
          className={selected === opcion.id ? ACTIVE : IDLE}
          onClick={() => {
            onSelect(opcion.id)
          }}
        >
          {opcion.name}
        </button>
      ))}
    </div>
  )
}
