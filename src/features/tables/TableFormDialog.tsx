import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { createTable, tableName, updateTable } from '../../api/tables'
import type { TableState } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormDialog from '../../components/FormDialog'
import FormMessage from '../../components/FormMessage'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { onSubmit } from '../../hooks/formSubmit'
import { withTable } from './tableCache'
import { MAX_LABEL, tableSchema, type TableValues } from './tableSchema'
import { useTableMutation } from './useTableMutation'

interface TableFormDialogProps {
  /** `null` crea una mesa; una mesa, la renombra. */
  readonly table: TableState | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Crear una mesa o cambiarle el nombre. */
export default function TableFormDialog({ table, open, onOpenChange }: TableFormDialogProps) {
  const { register, handleSubmit, formState, reset } = useForm<TableValues>({
    resolver: zodResolver(tableSchema),
    values: { label: table?.label ?? '' },
  })
  const guardar = useTableMutation({
    mutationFn: (valores: TableValues) =>
      table === null ? createTable(valores) : updateTable(table.id, valores),
    failure: 'No se pudo guardar la mesa.',
    success: table === null ? 'Mesa creada.' : 'Mesa renombrada.',
    updateCache: withTable,
    onSuccess: () => {
      reset()
      onOpenChange(false)
    },
    inlineError: true,
  })

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={table === null ? 'Nueva mesa' : `Renombrar ${tableName(table.label)}`}
      description="Un número o un nombre corto: «5», «Terraza 2», «Barra»."
    >
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={onSubmit(
          handleSubmit((valores) => {
            guardar.mutate(valores)
          }),
        )}
      >
        <TextField
          id="mesa-nombre"
          label="Nombre"
          icon="mesa"
          autoComplete="off"
          maxLength={MAX_LABEL}
          field={register('label')}
          error={formState.errors.label?.message}
        />
        {guardar.isError ? (
          <FormMessage tone="error">{errorMessage(guardar.error, 'No se pudo guardar la mesa.')}</FormMessage>
        ) : null}
        <DialogFormActions>
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={() => {
            onOpenChange(false)
          }}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" className="h-11 px-4" disabled={guardar.isPending}>
            {guardar.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFormActions>
      </form>
    </FormDialog>
  )
}
