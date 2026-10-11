import { createTable, updateTable } from '@/api/tables'
import type { TableState } from '@/api/types'
import { withTable } from './tableCache'
import type { TableValues } from './tableSchema'
import { useTableMutation } from './useTableMutation'

/** El texto cuando el servidor no explica por qué no se guardó la mesa. */
export const TABLE_SAVE_FAILURE = 'No se pudo guardar la mesa.'

/**
 * La mutación del formulario de mesa: crea la mesa si `table` es `null` y, si
 * no, le cambia el nombre. El error se muestra dentro del formulario.
 */
export function useTableSave(table: TableState | null, onSaved: () => void) {
  return useTableMutation({
    mutationFn: (values: TableValues) =>
      table === null ? createTable(values) : updateTable(table.id, values),
    failure: TABLE_SAVE_FAILURE,
    success: table === null ? 'Mesa creada.' : 'Mesa renombrada.',
    updateCache: withTable,
    onSuccess: onSaved,
    inlineError: true,
  })
}
