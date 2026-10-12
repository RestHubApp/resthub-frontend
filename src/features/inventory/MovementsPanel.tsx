import { useMemo } from 'react'

import { DataTable } from '@/components/DataTable'
import { TablePagination } from '@/components/TablePagination'
import { useTimeZone } from '@/store/session'
import { MovementFilters } from './MovementFilters'
import { buildMovementColumns } from './MovementColumns'
import { ErrorMessage } from '@/components/ErrorMessage'
import { useIngredients } from './useIngredients'
import { useMovementBook } from './useMovementBook'

/** El libro de movimientos: cada entrada y salida de stock, la más reciente primero. */
export function MovementsPanel() {
  const ingredients = useIngredients()
  const timeZone = useTimeZone()
  const columns = useMemo(() => buildMovementColumns(timeZone), [timeZone])
  const { book, pages, page, setPage, ingredient, type, changeIngredient, changeType } = useMovementBook()

  return (
    <div className="flex flex-col gap-4">
      <MovementFilters
        ingredients={ingredients.data ?? []}
        ingredientId={ingredient}
        onIngredient={changeIngredient}
        kind={type}
        onKind={changeType}
      />
      {book.isError ? (
        <ErrorMessage isError error={book.error} fallback="No se pudo cargar el historial de stock." />
      ) : (
        <DataTable
          label="Historial de stock"
          columns={columns}
          data={book.data?.items ?? []}
          isLoading={book.isPending}
          emptyMessage="No hay movimientos con estos filtros."
          getRowId={(mov) => String(mov.id)}
        />
      )}
      {pages > 1 ? <TablePagination actual={page} total={pages} onChange={setPage} /> : null}
    </div>
  )
}
