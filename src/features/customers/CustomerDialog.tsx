import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'

import { customersQueryKey, saveCustomer } from '../../api/customers'
import type { Customer } from '../../api/types'
import DialogFormActions from '../../components/DialogFormActions'
import FormDialog from '../../components/FormDialog'
import FormMessage from '../../components/FormMessage'
import TextareaField from '../../components/TextareaField'
import TextField from '../../components/TextField'
import { Button } from '../../components/ui/button'
import { onSubmit } from '../../hooks/formSubmit'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'
import { customerDefaults, customerRequest, customerSchema, type CustomerValues, LIMITES } from './customerSchema'

interface CustomerDialogProps {
  readonly open: boolean
  /** El cliente a editar; `null` para uno nuevo. */
  readonly customer: Customer | null
  readonly onClose: () => void
}

/** Alta o edición de un cliente de la libreta. */
export default function CustomerDialog({ open, customer, onClose }: CustomerDialogProps) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const { register, handleSubmit, formState } = useForm<CustomerValues>({
    resolver: zodResolver(customerSchema),
    values: customerDefaults(customer),
  })
  const guardar = useMutation({
    mutationFn: (values: CustomerValues) => saveCustomer(customerRequest(values), customer?.id),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: customersQueryKey })
      push({ tone: 'info', message: `${saved.name}: datos guardados.` })
      onClose()
    },
  })
  const errors = formState.errors

  return (
    <FormDialog
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto) {
          guardar.reset()
          onClose()
        }
      }}
      title={customer === null ? 'Nuevo cliente' : `Editar a ${customer.name}`}
      size="lg"
    >
      <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit(handleSubmit((values) => guardar.mutateAsync(values).catch(() => undefined)))}>
        <TextField id="customer-name" label="Nombre" icon="perfil" maxLength={LIMITES.name} field={register('name')} error={errors.name?.message} />
        <TextField id="customer-phone" label="Teléfono (opcional)" type="tel" inputMode="tel" maxLength={LIMITES.phone} hint="No se repite: identifica al cliente." field={register('phone')} error={errors.phone?.message} />
        <TextField id="customer-email" label="Correo (opcional)" type="email" maxLength={LIMITES.email} field={register('email')} error={errors.email?.message} />
        <TextField id="customer-address" label="Dirección (opcional)" icon="ubicacion" maxLength={LIMITES.address} field={register('address')} error={errors.address?.message} />
        <TextField id="customer-reference" label="Referencia (opcional)" icon="nota" maxLength={LIMITES.reference} field={register('reference')} error={errors.reference?.message} />
        <TextareaField id="customer-notes" label="Notas (opcional)" rows={2} placeholder="Alergias, preferencias, cómo pide" maxLength={LIMITES.notes} field={register('notes')} error={errors.notes?.message} />
        {guardar.isError ? (
          <div className="sm:col-span-2">
            <FormMessage tone="error">{errorMessage(guardar.error, 'No se pudo guardar el cliente.')}</FormMessage>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <DialogFormActions>
            <Button type="button" variant="outline" size="lg" className="h-11 px-4" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="h-11 px-4" disabled={guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFormActions>
        </div>
      </form>
    </FormDialog>
  )
}
