import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { saveSupplier } from '@/api/purchasing'
import type { Supplier, SupplierRequest } from '@/api/types'
import { DialogFormActions } from '@/components/DialogFormActions'
import { FormDialog } from '@/components/FormDialog'
import { textOptional } from '@/components/formRules'
import { TextField } from '@/components/TextField'
import { Button } from '@/components/ui/button'
import { onSubmit } from '@/hooks/formSubmit'
import { usePurchasingMutation } from './usePurchasingMutation'

// Los topes del servidor.
const schema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre del proveedor').max(80, 'Usa como máximo 80 caracteres'),
  contact: textOptional(80),
  phone: textOptional(20),
  notes: textOptional(300),
})
type Values = z.infer<typeof schema>

interface SupplierDialogProps {
  readonly open: boolean
  /** El proveedor que se edita; sin él, se da de alta uno nuevo. */
  readonly supplier: Supplier | null
  readonly onClose: () => void
}

function valuesOf(supplier: Supplier | null): Values {
  return {
    name: supplier?.name ?? '',
    contact: supplier?.contact ?? '',
    phone: supplier?.phone ?? '',
    notes: supplier?.notes ?? '',
  }
}

/** Alta o edición de un proveedor: nombre, contacto, teléfono y una nota. */
export function SupplierDialog({ open, supplier, onClose }: SupplierDialogProps) {
  const { register, handleSubmit, formState, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    values: valuesOf(supplier),
  })
  const close = () => {
    reset()
    onClose()
  }
  const save = usePurchasingMutation({
    mutationFn: (payload: SupplierRequest) => saveSupplier(payload, supplier?.id),
    success: (saved) => `Proveedor «${saved.name}» guardado.`,
    failure: 'No se pudo guardar el proveedor.',
    onSuccess: close,
  })

  return (
    <FormDialog
      open={open}
      title={supplier === null ? 'Nuevo proveedor' : `Editar ${supplier.name}`}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          close()
        }
      }}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={onSubmit(
          handleSubmit((values) => {
            save.mutate({ ...values, is_active: supplier === null || supplier.is_active })
          }),
        )}
      >
        <TextField id="proveedor-nombre" label="Nombre" field={register('name')} error={formState.errors.name?.message} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField id="proveedor-contacto" label="Contacto (opcional)" field={register('contact')} error={formState.errors.contact?.message} />
          <TextField id="proveedor-telefono" label="Teléfono (opcional)" type="tel" inputMode="tel" field={register('phone')} error={formState.errors.phone?.message} />
        </div>
        <TextField id="proveedor-nota" label="Nota (opcional)" placeholder="Entrega martes y viernes…" field={register('notes')} error={formState.errors.notes?.message} />
        <DialogFormActions>
          <Button type="button" variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogFormActions>
      </form>
    </FormDialog>
  )
}
