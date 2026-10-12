import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { saveSupplier } from '@/api/purchasing'
import type { Supplier, SupplierRequest } from '@/api/types'
import { FormFooter } from '@/components/FormFooter'
import { FormDialog } from '@/components/FormDialog'
import { onSubmit } from '@/hooks/formSubmit'
import { SupplierFields } from './SupplierFields'
import { supplierSchema, supplierValuesOf, type SupplierValues } from './supplierSchema'
import { usePurchasingMutation } from './usePurchasingMutation'

interface SupplierDialogProps {
  readonly open: boolean
  /** El proveedor que se edita; sin él, se da de alta uno nuevo. */
  readonly supplier: Supplier | null
  readonly onClose: () => void
}

/** Alta o edición de un proveedor: nombre, contacto, teléfono y una nota. */
export function SupplierDialog({ open, supplier, onClose }: SupplierDialogProps) {
  const { register, handleSubmit, formState, reset } = useForm<SupplierValues>({
    resolver: zodResolver(supplierSchema),
    values: supplierValuesOf(supplier),
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
        <SupplierFields register={register} errors={formState.errors} />
        <FormFooter mutation={save} onCancel={close} submit={{ label: 'Guardar' }} />
      </form>
    </FormDialog>
  )
}
