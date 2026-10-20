import { zodResolver } from '@hookform/resolvers/zod'

import { tableName } from '@/api/tables'
import type { TableState } from '@/api/types'
import { FormDialog } from '@/components/FormDialog'
import { FormFooter } from '@/components/FormFooter'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'
import { MAX_LABEL, tableSchema, type TableValues } from './tableSchema'
import { TABLE_SAVE_FAILURE, useTableSave } from './useTableSave'

interface TableFormDialogProps {
  /** `null` crea una mesa; una mesa, la renombra. */
  readonly table: TableState | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

/** Crear una mesa o cambiarle el nombre. */
export function TableFormDialog({ table, open, onOpenChange }: TableFormDialogProps) {
  const { register, handleSubmit, formState, reset } = useAppForm<TableValues>({
    resolver: zodResolver(tableSchema),
    values: { label: table?.label ?? '' },
  })
  const save = useTableSave(table, () => {
    reset()
    onOpenChange(false)
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
          handleSubmit((values) => {
            save.mutate(values)
          }),
        )}
      >
        <TextField
          id="mesa-nombre"
          label="Nombre"
          icon="table"
          autoComplete="off"
          maxLength={MAX_LABEL}
          field={register('label')}
          error={formState.errors.label?.message}
        />
        <FormFooter
          mutation={save}
          failureText={TABLE_SAVE_FAILURE}
          onCancel={() => {
            onOpenChange(false)
          }}
          submit={{ label: 'Guardar', pendingLabel: 'Guardando…' }}
        />
      </form>
    </FormDialog>
  )
}
