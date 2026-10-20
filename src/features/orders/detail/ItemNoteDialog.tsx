import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormFooter } from '@/components/FormFooter'
import { FormDialog } from '@/components/FormDialog'
import { textOptional } from '@/components/formRules'
import { TextField } from '@/components/TextField'
import { onSubmit } from '@/hooks/formSubmit'
import { useAppForm } from '@/hooks/useAppForm'

// El mismo tope que el servidor.
const MAX_NOTE = 200
const schema = z.object({ notes: textOptional(MAX_NOTE) })
type Values = z.infer<typeof schema>

interface ItemNoteDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly dish: string
  readonly notes: string
  readonly pending: boolean
  readonly onSave: (notes: string) => void
}

/** Cambiar la nota de un plato de un pedido que todavia no se envio. */
export function ItemNoteDialog({
  open,
  onOpenChange,
  dish,
  notes,
  pending,
  onSave,
}: ItemNoteDialogProps) {
  const { register, handleSubmit, formState } = useAppForm<Values>({
    resolver: zodResolver(schema),
    values: { notes },
  })

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`Nota de ${dish}`}>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={onSubmit(
          handleSubmit((values) => {
            onSave(values.notes)
          }),
        )}
      >
        <TextField
          id="nota-plato"
          label="Nota para cocina"
          icon="note"
          placeholder="Sin cebolla, alergia al maní…"
          maxLength={MAX_NOTE}
          autoComplete="off"
          hint="Déjala vacía para quitarla."
          field={register('notes')}
          error={formState.errors.notes?.message}
        />
        <FormFooter
          mutation={{ isPending: pending }}
          onCancel={() => {
            onOpenChange(false)
          }}
          submit={{ label: 'Guardar nota' }}
        />
      </form>
    </FormDialog>
  )
}
