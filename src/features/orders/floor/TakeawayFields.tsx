import type { UseFormReturn } from 'react-hook-form'

import { TextField } from '@/components/TextField'
import { DeliveryFields } from './DeliveryFields'
import { MAX_CUSTOMER, type TakeawayValues } from './takeawaySchema'

interface TakeawayFieldsProps {
  readonly form: UseFormReturn<TakeawayValues>
  readonly delivery: boolean
}

/** Nombre del cliente y, si es delivery, teléfono, dirección y referencia. */
export function TakeawayFields({ form, delivery }: TakeawayFieldsProps) {
  const { register, formState } = form
  const errors = formState.errors

  return (
    <>
      <TextField
        id="takeaway-customer"
        label={delivery ? 'Nombre de quien recibe' : 'Nombre del cliente (opcional)'}
        placeholder="Por ejemplo, Ana"
        icon="profile"
        autoComplete="off"
        maxLength={MAX_CUSTOMER}
        hint="Se muestra en el tablero para entregar el pedido correcto."
        field={register('customer_name')}
        error={errors.customer_name?.message}
      />
      {delivery ? <DeliveryFields form={form} /> : null}
    </>
  )
}
