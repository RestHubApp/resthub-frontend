import { useState } from 'react'

import type { StockCount } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { type CountFilter, visibleLines } from './countFilter'
import { CountLineRow } from './CountLineRow'
import { CountToolbar } from './CountToolbar'

interface CountSheetProps {
  readonly count: StockCount
  readonly canEdit: boolean
}

/**
 * La lista para contar, pensada para el celular o la tablet en la barra:
 * una tarjeta por insumo, el buscador arriba y un filtro para ver solo lo que falta.
 * Lo recién guardado se queda a la vista con «Contado», para revisarlo.
 */
export function CountSheet({ count, canEdit }: CountSheetProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<CountFilter>('all')
  const lines = visibleLines(count.lines, search, filter)

  return (
    <section aria-label="Insumos para contar" className="flex flex-col gap-4">
      <CountToolbar
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        counted={count.counted_lines}
        total={count.total_lines}
      />
      {lines.length === 0 ? (
        <EmptyState title={filter === 'pending' && search === '' ? 'Ya contaste todo. Revisa y cierra el conteo.' : 'Ningún insumo con esa búsqueda.'} />
      ) : (
        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
          {lines.map((line) => (
            <CountLineRow key={line.ingredient_id} countId={count.id} line={line} canEdit={canEdit} />
          ))}
        </ul>
      )}
    </section>
  )
}
