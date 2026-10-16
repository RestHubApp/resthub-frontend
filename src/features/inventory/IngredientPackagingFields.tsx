import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { IngredientUnit } from '@/api/types'
import { TextField } from '@/components/TextField'
import type { IngredientValues } from './inventorySchema'
import { QuantityField } from './QuantityField'
import { inputUnits } from './units'

interface IngredientPackagingFieldsProps {
  readonly register: UseFormRegister<IngredientValues>
  readonly errors: FieldErrors<IngredientValues>
  readonly unit: IngredientUnit
}

const WEIGH_HELP =
  'Para contar por peso: pesa en gramos un envase lleno sin abrir y uno vacío y limpio (con su tapa). Después, en el conteo, basta con pesar el que está abierto.'

/**
 * La presentación del insumo («botella de 750 ml»), opcional.
 *
 * Con ella, las compras y los conteos se escriben en envases. Con los pesos
 * del envase lleno y vacío, además, un envase abierto se cuenta poniéndolo en
 * la balanza.
 */
export function IngredientPackagingFields({ register, errors, unit }: IngredientPackagingFieldsProps) {
  return (
    <fieldset className="m-0 flex flex-col gap-4 rounded-lg border p-4">
      <legend className="px-1 text-sm font-semibold">Envase (opcional)</legend>
      <p className="m-0 text-sm text-muted-foreground">
        Si lo compras o lo cuentas por botella, saco o lata, di cuánto trae cada uno.
      </p>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <QuantityField
          id="packaging-size"
          label="Cuánto trae"
          amount={register('packaging_size')}
          unit={register('packaging_size_unit')}
          units={inputUnits(unit).toReversed()}
          error={errors.packaging_size?.message}
        />
        <TextField
          id="packaging-label"
          label="Nombre del envase"
          placeholder="botella, saco, lata…"
          autoComplete="off"
          maxLength={30}
          field={register('packaging_label')}
          error={errors.packaging_label?.message}
        />
        <TextField
          id="packaging-full"
          label="Peso lleno (g)"
          inputMode="decimal"
          autoComplete="off"
          field={register('packaging_full')}
          error={errors.packaging_full?.message}
        />
        <TextField
          id="packaging-empty"
          label="Peso vacío (g)"
          inputMode="decimal"
          autoComplete="off"
          field={register('packaging_empty')}
          error={errors.packaging_empty?.message}
        />
      </div>
      <p className="m-0 text-sm text-muted-foreground">{WEIGH_HELP}</p>
    </fieldset>
  )
}
