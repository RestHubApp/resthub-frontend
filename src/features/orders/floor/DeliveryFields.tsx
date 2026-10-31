import type { UseFormReturn } from 'react-hook-form'

import { TextField } from '@/components/TextField'
import * as icons from '@/components/icons'
import { MAX_ADDRESS, MAX_PHONE, MAX_REFERENCE, type TakeawayValues } from './takeawaySchema'

interface DeliveryFieldsProps {
  readonly form: UseFormReturn<TakeawayValues>
}

/** Los datos que pide el delivery: teléfono, dirección y referencia. */
export function DeliveryFields({ form }: DeliveryFieldsProps) {
  const { register, formState } = form
  const errors = formState.errors

  return (
    <>
      <TextField
        id="takeaway-phone"
        type="tel"
        inputMode="tel"
        label="Teléfono"
        placeholder="Por ejemplo, 987654321"
        autoComplete="off"
        maxLength={MAX_PHONE}
        field={register('phone')}
        error={errors.phone?.message}
      />
      <TextField
        id="takeaway-address"
        label="Dirección de entrega"
        placeholder="Calle, número, distrito"
        icon={icons.location}
        autoComplete="off"
        maxLength={MAX_ADDRESS}
        field={register('address')}
        error={errors.address?.message}
      />
      <TextField
        id="takeaway-reference"
        label="Referencia (opcional)"
        placeholder="Por ejemplo, frente al parque"
        icon={icons.note}
        autoComplete="off"
        maxLength={MAX_REFERENCE}
        field={register('reference')}
        error={errors.reference?.message}
      />
    </>
  )
}
