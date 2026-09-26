import type { UseFormReturn } from 'react-hook-form'

import { tableName } from '../../api/tables'
import type { TableState } from '../../api/types'
import SelectField from '../../components/SelectField'
import TextareaField from '../../components/TextareaField'
import TextField from '../../components/TextField'
import { NativeSelectOption } from '../../components/ui/native-select'
import { LIMITES, type ReservationValues } from './reservationSchema'

interface ReservationFieldsProps {
  readonly form: UseFormReturn<ReservationValues>
  readonly tables: readonly TableState[]
}

/** Los datos de una reserva: quién, cuándo, cuántos, en qué mesa. */
export default function ReservationFields({ form, tables }: ReservationFieldsProps) {
  const { register, formState } = form
  const errors = formState.errors

  return (
    <>
      <TextField id="reservation-name" label="A nombre de" icon="perfil" maxLength={LIMITES.name} field={register('customer_name')} error={errors.customer_name?.message} />
      <TextField id="reservation-phone" label="Teléfono (opcional)" type="tel" inputMode="tel" maxLength={LIMITES.phone} field={register('phone')} error={errors.phone?.message} />
      <TextField id="reservation-day" label="Día" type="date" field={register('day')} error={errors.day?.message} />
      <TextField id="reservation-time" label="Hora" type="time" step="900" field={register('time')} error={errors.time?.message} />
      <TextField id="reservation-party" label="Personas" inputMode="numeric" icon="personal" field={register('party_size')} error={errors.party_size?.message} />
      <TextField id="reservation-duration" label="Duración (minutos)" inputMode="numeric" field={register('duration_minutes')} error={errors.duration_minutes?.message} hint="Cuánto se guarda la mesa." />
      <SelectField id="reservation-table" label="Mesa (opcional)" icon="mesa" placeholder="Sin mesa asignada" field={register('table_id')} error={errors.table_id?.message}>
        {tables.map((mesa) => (
          <NativeSelectOption key={mesa.id} value={String(mesa.id)}>
            {tableName(mesa.label)}
          </NativeSelectOption>
        ))}
      </SelectField>
      <TextareaField id="reservation-notes" label="Notas (opcional)" rows={2} placeholder="Cumpleaños, silla para bebé, alergias" maxLength={LIMITES.notes} field={register('notes')} error={errors.notes?.message} />
    </>
  )
}
