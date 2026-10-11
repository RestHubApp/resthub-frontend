import type { UseFormReturn } from 'react-hook-form'

import { tableName } from '@/api/tables'
import type { TableState } from '@/api/types'
import { SelectField } from '@/components/SelectField'
import { TextareaField } from '@/components/TextareaField'
import { TextField } from '@/components/TextField'
import { NativeSelectOption } from '@/components/ui/native-select'
import { LIMITS, type ReservationValues } from './reservationSchema'

interface ReservationFieldsProps {
  readonly form: UseFormReturn<ReservationValues>
  readonly tables: readonly TableState[]
}

/** El mensaje de un campo, si tiene error. */
function messageOf(error: { readonly message?: string | undefined } | undefined): string | undefined {
  return error?.message
}

/** Los datos de una reserva: quién, cuándo, cuántos, en qué mesa. */
export function ReservationFields({ form, tables }: ReservationFieldsProps) {
  const { register, formState } = form
  const errors = formState.errors

  return (
    <>
      <TextField id="reservation-name" label="A nombre de" icon="profile" maxLength={LIMITS.name} field={register('customer_name')} error={messageOf(errors.customer_name)} />
      <TextField id="reservation-phone" label="Teléfono (opcional)" type="tel" inputMode="tel" maxLength={LIMITS.phone} field={register('phone')} error={messageOf(errors.phone)} />
      <TextField id="reservation-day" label="Día" type="date" field={register('day')} error={messageOf(errors.day)} />
      <TextField id="reservation-time" label="Hora" type="time" step="900" field={register('time')} error={messageOf(errors.time)} />
      <TextField id="reservation-party" label="Personas" inputMode="numeric" icon="staff" field={register('party_size')} error={messageOf(errors.party_size)} />
      <TextField id="reservation-duration" label="Duración (minutos)" inputMode="numeric" field={register('duration_minutes')} error={messageOf(errors.duration_minutes)} hint="Cuánto se guarda la mesa." />
      <SelectField id="reservation-table" label="Mesa (opcional)" icon="table" placeholder="Sin mesa asignada" field={register('table_id')} error={messageOf(errors.table_id)}>
        {tables.map((table) => (
          <NativeSelectOption key={table.id} value={String(table.id)}>
            {tableName(table.label)}
          </NativeSelectOption>
        ))}
      </SelectField>
      <TextareaField id="reservation-notes" label="Notas (opcional)" rows={2} placeholder="Cumpleaños, silla para bebé, alergias" maxLength={LIMITS.notes} field={register('notes')} error={messageOf(errors.notes)} />
    </>
  )
}
