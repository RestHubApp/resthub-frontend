import type { OrderMenuItem, OrderMenuSection } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { DishRow } from './DishRow'
import { lineKeyFor } from './useOrderDraft'

interface MenuSectionsProps {
  readonly sections: readonly OrderMenuSection[]
  /** Lo que se busca, para el aviso cuando nada coincide. */
  readonly term: string
  /** Cuantas porciones de cada plato hay en el borrador. */
  readonly quantities: ReadonlyMap<number, number>
  readonly onAdd: (item: OrderMenuItem) => void
  readonly onChange: (lineKey: string, quantity: number) => void
}

/** Las categorias de la carta con sus platos, o el aviso de que no hay ninguno que mostrar. */
export function MenuSections({ sections, term, quantities, onAdd, onChange }: MenuSectionsProps) {
  return (
    <>
      {sections.length === 0 ? (
        <EmptyState
          title={term.trim() === '' ? 'No hay platos en la carta' : `Ningún plato coincide con «${term.trim()}»`}
        />
      ) : null}
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`categoria-${String(section.id)}`} className="flex flex-col gap-2">
          <h2 id={`categoria-${String(section.id)}`} className="m-0 text-base font-semibold">
            {section.name}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {section.items.map((item) => (
              <DishRow
                key={item.id}
                item={item}
                quantity={quantities.get(item.id) ?? 0}
                onAdd={() => {
                  onAdd(item)
                }}
                onChange={(quantity) => {
                  onChange(lineKeyFor(item.id), quantity)
                }}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
