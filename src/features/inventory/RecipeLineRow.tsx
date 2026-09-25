import type { UseFormRegisterReturn } from 'react-hook-form'

import FieldError from '../../components/FieldError'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import type { RecipeIngredient } from './recipeMath'
import { baseUnitLabel, formatUnitCost } from './units'
import { formatMoney } from '../../services/format'

interface RecipeLineRowProps {
  readonly index: number
  readonly ingredient: RecipeIngredient
  readonly field: UseFormRegisterReturn
  readonly cost: number
  readonly error?: string
  readonly readOnly: boolean
  readonly onRemove: () => void
}

/** Un insumo de la receta: cuánto lleva una porción y cuánto cuesta eso. */
export default function RecipeLineRow({
  index,
  ingredient,
  field,
  cost,
  error,
  readOnly,
  onRemove,
}: RecipeLineRowProps) {
  const id = `recipe-line-${String(index)}`
  const errorId = `${id}-error`

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_11rem_7rem_auto]">
      <div className="flex min-w-0 flex-col">
        <label htmlFor={id} className="font-medium">
          {ingredient.name}
        </label>
        <span className="text-sm text-muted-foreground">{formatUnitCost(ingredient.unitCost, ingredient.unit)}</span>
      </div>
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
          <span className="text-sm text-muted-foreground">{baseUnitLabel(ingredient.unit)}</span>
        </div>
        <FieldError id={errorId} message={error} />
      </div>
      <p className="col-start-2 row-start-2 m-0 text-right font-semibold tabular-nums sm:col-start-auto sm:row-start-auto">
        <span className="sr-only">Costo de la línea: </span>
        {formatMoney(cost)}
      </p>
      {readOnly ? null : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="col-start-2 row-start-1 size-11 justify-self-end text-muted-foreground hover:text-destructive sm:col-start-auto sm:row-start-auto"
          aria-label={`Quitar ${ingredient.name}`}
          onClick={onRemove}
        >
          <Icon name="eliminar" size={18} />
        </Button>
      )}
    </li>
  )
}
