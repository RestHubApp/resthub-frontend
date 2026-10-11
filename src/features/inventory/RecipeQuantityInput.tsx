import type { UseFormRegisterReturn } from 'react-hook-form'

import { FieldError } from '@/components/FieldError'
import { Input } from '@/components/ui/input'
import type { IngredientUnit } from '@/api/types'
import { baseUnitLabel } from './units'

interface RecipeQuantityInputProps {
  readonly id: string
  readonly field: UseFormRegisterReturn
  readonly unit: IngredientUnit
  readonly error?: string | undefined
  readonly readOnly: boolean
}

/** La cantidad de un insumo por porción, con su unidad y el error de validación. */
export function RecipeQuantityInput({ id, field, unit, error, readOnly }: RecipeQuantityInputProps) {
  const errorId = `${id}-error`

  return (
    <div className="col-start-1 flex flex-col gap-1 sm:col-start-auto">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          className="h-11 w-28 text-right tabular-nums"
          inputMode="decimal"
          autoComplete="off"
          readOnly={readOnly}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : errorId}
          {...field}
        />
        <span className="text-sm text-muted-foreground">{baseUnitLabel(unit)}</span>
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  )
}
