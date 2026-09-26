import type { UseFormReturn } from 'react-hook-form'

import TextField from '../../../components/TextField'
import { MAX_CLIENTE, MAX_DIRECCION, MAX_REFERENCIA, MAX_TELEFONO, type TakeawayValues } from './takeawaySchema'

interface TakeawayFieldsProps {
  readonly form: UseFormReturn<TakeawayValues>
  readonly delivery: boolean
}

/** Nombre del cliente y, si es delivery, teléfono, dirección y referencia. */
export default function TakeawayFields({ form, delivery }: TakeawayFieldsProps) {
  const { register, formState } = form
  const errors = formState.errors

  return (
    <>
      <TextField
        id="takeaway-customer"
        label={delivery ? 'Nombre de quien recibe' : 'Nombre del cliente (opcional)'}
        placeholder="Por ejemplo, Ana"
        icon="perfil"
        autoComplete="off"
        maxLength={MAX_CLIENTE}
        hint="Se muestra en el tablero para entregar el pedido correcto."
        field={register('customer_name')}
        error={errors.customer_name?.message}
      />
      {delivery ? (
        <>
          <TextField
            id="takeaway-phone"
            type="tel"
            inputMode="tel"
            label="Teléfono"
            placeholder="Por ejemplo, 987654321"
            autoComplete="off"
            maxLength={MAX_TELEFONO}
            field={register('phone')}
            error={errors.phone?.message}
          />
          <TextField
            id="takeaway-address"
            label="Dirección de entrega"
            placeholder="Calle, número, distrito"
            icon="ubicacion"
            autoComplete="off"
            maxLength={MAX_DIRECCION}
            field={register('address')}
            error={errors.address?.message}
          />
          <TextField
            id="takeaway-reference"
            label="Referencia (opcional)"
            placeholder="Por ejemplo, frente al parque"
            icon="nota"
            autoComplete="off"
            maxLength={MAX_REFERENCIA}
            field={register('reference')}
            error={errors.reference?.message}
          />
        </>
      ) : null}
    </>
  )
}
