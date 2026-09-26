import { useQuery } from '@tanstack/react-query'
import { useDeferredValue, useMemo, useState } from 'react'

import { orderMenuQuery } from '../../../api/orders'
import type { OrderMenuItem } from '../../../api/types'
import EmptyState from '../../../components/EmptyState'
import ListSkeleton from '../../../components/ListSkeleton'
import QueryError from '../QueryError'
import CategoryChips from './CategoryChips'
import DishRow from './DishRow'
import { visibleSections } from './menuFilter'
import SearchBox from './SearchBox'
import ModifierDialog from './ModifierDialog'
import { type DraftLine, type DraftModifier, lineKeyFor } from './useOrderDraft'

interface MenuPickerProps {
  readonly lines: readonly DraftLine[]
  readonly onAdd: (item: OrderMenuItem, modifiers?: readonly DraftModifier[]) => void
  readonly onChange: (lineKey: string, quantity: number) => void
}

/** Cuántas porciones de cada plato hay en el borrador, sumando sus combinaciones. */
function countByDish(lines: readonly DraftLine[]): Map<number, number> {
  const cuenta = new Map<number, number>()
  for (const line of lines) {
    cuenta.set(line.menuItemId, (cuenta.get(line.menuItemId) ?? 0) + line.quantity)
  }
  return cuenta
}

/** La carta para elegir platos: busqueda, categorias y la lista. */
export default function MenuPicker({ lines, onAdd, onChange }: MenuPickerProps) {
  const carta = useQuery(orderMenuQuery)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState<number | null>(null)
  const termino = useDeferredValue(busqueda)
  const cantidades = useMemo(() => countByDish(lines), [lines])
  const [configurando, setConfigurando] = useState<OrderMenuItem | null>(null)
  const secciones = useMemo(
    () => visibleSections(carta.data?.categories ?? [], termino, categoria),
    [carta.data, termino, categoria],
  )

  if (carta.isPending) {
    return <ListSkeleton label="Cargando la carta…" count={6} />
  }
  if (carta.isError) {
    return (
      <QueryError
        error={carta.error}
        fallback="No se pudo cargar la carta."
        onRetry={() => void carta.refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBox value={busqueda} onChange={setBusqueda} />
      <CategoryChips
        sections={carta.data.categories.filter((section) => section.is_active)}
        selected={categoria}
        onSelect={setCategoria}
      />
      {secciones.length === 0 ? (
        <EmptyState
          title={termino.trim() === '' ? 'No hay platos en la carta' : `Ningún plato coincide con «${termino.trim()}»`}
        />
      ) : null}
      {secciones.map((seccion) => (
        <section key={seccion.id} aria-labelledby={`categoria-${String(seccion.id)}`} className="flex flex-col gap-2">
          <h2 id={`categoria-${String(seccion.id)}`} className="m-0 text-base font-semibold">
            {seccion.name}
          </h2>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {seccion.items.map((item) => (
              <DishRow
                key={item.id}
                item={item}
                quantity={cantidades.get(item.id) ?? 0}
                onAdd={() => {
                  if (item.modifier_groups.length > 0) {
                    setConfigurando(item)
                    return
                  }
                  onAdd(item)
                }}
                onChange={(cantidad) => {
                  onChange(lineKeyFor(item.id), cantidad)
                }}
              />
            ))}
          </ul>
        </section>
      ))}
      <ModifierDialog
        item={configurando}
        onConfirm={(item, modifiers) => {
          onAdd(item, modifiers)
          setConfigurando(null)
        }}
        onClose={() => {
          setConfigurando(null)
        }}
      />
    </div>
  )
}
