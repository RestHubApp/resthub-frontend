import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { customersQueryKey, saveCustomer } from '@/api/customers'
import type { Customer } from '@/api/types'
import { SaveFormDialog } from '@/components/SaveFormDialog'
import { TextareaField } from '@/components/TextareaField'
import { TextField } from '@/components/TextField'
import { useAppForm } from '@/hooks/useAppForm'
import { useNotifications } from '@/store/notifications'
import { CustomerConsent } from './CustomerConsent'
import { customerDefaults, customerRequest, customerSchema, type CustomerValues, LIMITS } from './customerSchema'

interface CustomerDialogProps {
  readonly open: boolean
  /** El cliente a editar; `null` para uno nuevo. */
  readonly customer: Customer | null
  readonly onClose: () => void
}

/** Alta o edición de un cliente de la libreta. */
export function CustomerDialog({ open, customer, onClose: handleClose }: CustomerDialogProps) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  // El alta exige el consentimiento; un cliente guardado antes de pedirlo
  // puede darlo al editarse; uno que ya lo dio no lo vuelve a dar.
  const { register, handleSubmit, formState, reset, control } = useAppForm<CustomerValues>({
    resolver: zodResolver(customerSchema(customer === null)),
    values: customerDefaults(customer),
  })
  // Al guardar, la ventana se cierra sin pasar por `onOpenChange` y el
  // formulario conservaba lo escrito: «Nuevo cliente» volvía a abrir con los
  // datos del anterior. Al cerrarse, el formulario vuelve a sus valores.
  const onClose = () => {
    reset(customerDefaults(customer))
    handleClose()
  }
  const save = useMutation({
    mutationFn: (values: CustomerValues) => saveCustomer(customerRequest(values), customer?.id),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: customersQueryKey })
      push({ tone: 'info', message: `${saved.name}: datos guardados.` })
      onClose()
    },
  })
  const errors = formState.errors

  return (
    <SaveFormDialog
      open={open}
      title={customer === null ? 'Nuevo cliente' : `Editar a ${customer.name}`}
      onClose={onClose}
      save={save}
      failureText="No se pudo guardar el cliente."
      handleSubmit={handleSubmit((values) => save.mutateAsync(values).catch(() => undefined))}
    >
      <TextField id="customer-name" label="Nombre" icon="profile" maxLength={LIMITS.name} field={register('name')} error={errors.name?.message} />
      <TextField id="customer-phone" label="Teléfono (opcional)" type="tel" inputMode="tel" maxLength={LIMITS.phone} hint="No se repite: identifica al cliente." field={register('phone')} error={errors.phone?.message} />
      <TextField id="customer-email" label="Correo (opcional)" type="email" maxLength={LIMITS.email} field={register('email')} error={errors.email?.message} />
      <TextField id="customer-address" label="Dirección (opcional)" icon="location" maxLength={LIMITS.address} field={register('address')} error={errors.address?.message} />
      <TextField id="customer-reference" label="Referencia (opcional)" icon="note" maxLength={LIMITS.reference} field={register('reference')} error={errors.reference?.message} />
      <TextareaField id="customer-notes" label="Notas (opcional)" rows={2} placeholder="Alergias, preferencias, cómo pide" maxLength={LIMITS.notes} field={register('notes')} error={errors.notes?.message} />
      <div className="sm:col-span-2">
        <CustomerConsent control={control} customer={customer} errors={errors} />
      </div>
    </SaveFormDialog>
  )
}
