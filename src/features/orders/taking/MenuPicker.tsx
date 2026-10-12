import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { orderMenuQuery } from '@/api/orders'
import type { OrderMenuItem } from '@/api/types'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { CategoryChips } from './CategoryChips'
import { MenuSections } from './MenuSections'
import { ModifierDialog } from './ModifierDialog'
import { SearchBox } from './SearchBox'
import { useMenuFilters } from './useMenuFilters'
import type { DraftLine, DraftModifier } from './useOrderDraft'

interface MenuPickerProps {
  readonly lines: readonly DraftLine[]
  readonly onAdd: (item: OrderMenuItem, modifiers?: readonly DraftModifier[]) => void
  readonly onChange: (lineKey: string, quantity: number) => void
}

/** La carta para elegir platos: busqueda, categorias y la lista. */
export function MenuPicker({ lines, onAdd, onChange }: MenuPickerProps) {
  const menu = useQuery(orderMenuQuery)
  const filters = useMenuFilters(menu.data?.categories, lines)
  const [configuring, setConfiguring] = useState<OrderMenuItem | null>(null)

  if (menu.isPending) {
    return <ListSkeleton label="Cargando la carta…" count={6} />
  }
  if (menu.isError && menu.data === undefined) {
    return (
      <RetryQueryError error={menu.error} fallback="No se pudo cargar la carta." onRetry={() => void menu.refetch()} />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={filters.search} onChange={filters.setSearch} />
      <CategoryChips
        sections={menu.data.categories.filter((section) => section.is_active)}
        selected={filters.category}
        onSelect={filters.setCategory}
      />
      <MenuSections
        sections={filters.sections}
        term={filters.term}
        quantities={filters.quantities}
        onAdd={(item) => {
          if (item.modifier_groups.length > 0) {
            setConfiguring(item)
            return
          }
          onAdd(item)
        }}
        onChange={onChange}
      />
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
