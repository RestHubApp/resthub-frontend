import type { UseFormRegisterReturn } from 'react-hook-form'

import FieldError from '../../components/FieldError'
import FieldHint from '../../components/FieldHint'
import { fieldIds } from '../../components/fieldIds'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { NativeSelect, NativeSelectOption } from '../../components/ui/native-select'
import type { InputUnit } from './units'

interface QuantityFieldProps {
  readonly id: string
  readonly label: string
  readonly amount: UseFormRegisterReturn
  /** La lista de unidades. Con una sola unidad, se muestra como texto. */
  readonly unit: UseFormRegisterReturn
  readonly units: readonly InputUnit[]
  readonly error?: string
  readonly hint?: string
}

/**
 * Una cantidad y su unidad, lado a lado.
 *
 * Quien compra cinco kilos escribe "5" y elige "kg"; nadie tiene que hacer la
 * cuenta a gramos. La conversión la hace el formulario al enviar.
 */
export default function QuantityField({
  id,
  label,
  amount,
  unit,
  units,
  error,
  hint,
}: QuantityFieldProps) {
  const ids = fieldIds(id, hint, error)
  const unica = units.length === 1 ? units[0] : undefined

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          className="h-11 min-w-0 flex-1"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={error !== undefined}
          aria-describedby={ids.describedBy}
          {...amount}
        />
        {unica === undefined ? (
          <NativeSelect
            aria-label={`Unidad de ${label.toLowerCase()}`}
            className="w-24 [&_select]:h-11"
            {...unit}
          >
            {units.map((opcion) => (
              <NativeSelectOption key={opcion.value} value={opcion.value}>
                {opcion.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        ) : (
          <span className="flex h-11 min-w-16 items-center justify-center rounded-lg bg-muted px-3 text-sm font-medium">
            {unica.label}
          </span>
        )}
      </div>
      <FieldHint id={ids.hintId} hint={hint} />
      <FieldError id={ids.errorId} message={error} />
    </div>
  )
}
