import type { UseFormRegisterReturn } from 'react-hook-form'

import { SelectField } from '@/components/SelectField'
import { NativeSelectOption } from '@/components/ui/native-select'
import { TAX_REGIMES } from './billingSettingsSchema'

interface TaxRegimeFieldProps {
  readonly field: UseFormRegisterReturn
  readonly error: string | undefined
}

/** El régimen tributario del local: decide si emite solo boletas (Nuevo RUS) o también facturas. */
export function TaxRegimeField({ field, error }: TaxRegimeFieldProps) {
  return (
    <SelectField
      id="fiscal-regimen"
      label="Régimen tributario"
      hint="Decide qué comprobantes emite el local: con el Nuevo RUS solo boletas; con los demás regímenes, boletas y facturas."
      field={field}
      error={error}
    >
      {TAX_REGIMES.map((regime) => (
        <NativeSelectOption key={regime.id} value={regime.id}>
          {regime.label}
        </NativeSelectOption>
      ))}
    </SelectField>
  )
}
