import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import DialogFormActions from '../../../components/DialogFormActions'
import FormDialog from '../../../components/FormDialog'
import { textoOpcional } from '../../../components/formRules'
import TextField from '../../../components/TextField'
import { Button } from '../../../components/ui/button'
import { onSubmit } from '../../../hooks/formSubmit'

// El mismo tope que el servidor.
const MAX_NOTA = 200
const schema = z.object({ notes: textoOpcional(MAX_NOTA) })
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
export default function ItemNoteDialog({
  open,
  onOpenChange,
  dish,
  notes,
  pending,
  onSave,
}: ItemNoteDialogProps) {
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    values: { notes },
  })

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} title={`Nota de ${dish}`}>
      <form
        noValidate
        className="flex flex-col gap-5"
        onSubmit={onSubmit(
          handleSubmit((valores) => {
            onSave(valores.notes)
          }),
        )}
      >
        <TextField
          id="nota-plato"
          label="Nota para cocina"
          icon="nota"
          placeholder="Sin cebolla, alergia al maní…"
          maxLength={MAX_NOTA}
          autoComplete="off"
          hint="Déjala vacía para quitarla."
          field={register('notes')}
          error={formState.errors.notes?.message}
        />
        <DialogFormActions>
          <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={() => {
            onOpenChange(false)
          }}>
            Cancelar
          </Button>
          <Button type="submit" size="lg" className="h-11 px-4" disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar nota'}
          </Button>
        </DialogFormActions>
      </form>
    </FormDialog>
  )
}
