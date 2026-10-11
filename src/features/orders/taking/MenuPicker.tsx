import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useMemo, useState } from 'react'

import { orderMenuQuery } from '@/api/orders'
import type { OrderMenuItem } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { QueryError } from '@/features/orders/QueryError'
import { CategoryChips } from './CategoryChips'
import { DishRow } from './DishRow'
import { visibleSections } from './menuFilter'
import { SearchBox } from './SearchBox'
import { ModifierDialog } from './ModifierDialog'
import { type DraftLine, type DraftModifier, lineKeyFor } from './useOrderDraft'

interface MenuPickerProps {
  readonly lines: readonly DraftLine[]
  readonly onAdd: (item: OrderMenuItem, modifiers?: readonly DraftModifier[]) => void
  readonly onChange: (lineKey: string, quantity: number) => void
}

/** Cuántas porciones de cada plato hay en el borrador, sumando sus combinaciones. */
function countByDish(lines: readonly DraftLine[]): Map<number, number> {
  const account = new Map<number, number>()
  for (const line of lines) {
    account.set(line.menuItemId, (account.get(line.menuItemId) ?? 0) + line.quantity)
  }
  return account
}

/** La carta para elegir platos: busqueda, categorias y la lista. */
export function MenuPicker({ lines, onAdd, onChange }: MenuPickerProps) {
  const menu = useQuery(orderMenuQuery)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<number | null>(null)
  const term = useDeferredValue(search)
  const quantities = useMemo(() => countByDish(lines), [lines])
  const [configuring, setConfiguring] = useState<OrderMenuItem | null>(null)
  const sections = useMemo(
    () => visibleSections(menu.data?.categories ?? [], term, category),
    [menu.data, term, category],
  )

  if (menu.isPending) {
    return <ListSkeleton label="Cargando la carta…" count={6} />
  }
  if (menu.isError && menu.data === undefined) {
    return (
      <QueryError error={menu.error} fallback="No se pudo cargar la carta." onRetry={() => void menu.refetch()} />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={search} onChange={setSearch} />
      <CategoryChips
        sections={menu.data.categories.filter((section) => section.is_active)}
        selected={category}
        onSelect={setCategory}
      />
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
                  if (item.modifier_groups.length > 0) {
                    setConfiguring(item)
                    return
                  }
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
      <ModifierDialog
        item={configuring}
        onConfirm={async (item, modifiers) => {
          const fresh = await menu.refetch()
          if (fresh.isError || fresh.data === undefined) return false
          onAdd(item, modifiers)
          setConfiguring(null)
          return true
        }}
        onClose={() => {
          setConfiguring(null)
        }}
      />
    </div>
  )
}
