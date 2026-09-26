import type { UseFormRegisterReturn } from 'react-hook-form'

import SelectField from '../../components/SelectField'
import { NativeSelectOption } from '../../components/ui/native-select'
import { timeZoneLabel, timeZoneOptions } from './timeZones'

interface TimeZoneFieldProps {
  readonly id: string
  readonly field: UseFormRegisterReturn
  readonly error?: string
  /** La zona guardada del restaurante, para que aparezca aunque no sea de las comunes. */
  readonly current?: string
}

/** La zona horaria del restaurante: decide qué es «hoy» y a qué hora se ve cada pedido. */
export default function TimeZoneField({ id, field, error, current }: TimeZoneFieldProps) {
  return (
    <SelectField
      id={id}
      label="Zona horaria"
      icon="horario"
      hint="Con ella se cuentan el día, la caja y las horas de los pedidos del local."
      field={field}
      error={error}
    >
      {timeZoneOptions(current).map((zona) => (
        <NativeSelectOption key={zona.value} value={zona.value}>
          {timeZoneLabel(zona)}
        </NativeSelectOption>
      ))}
    </SelectField>
  )
}
