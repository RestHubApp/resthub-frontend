import type { UseFormRegisterReturn } from 'react-hook-form'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import type { RecipeIngredient } from './recipeMath'
import { RecipeQuantityInput } from './RecipeQuantityInput'
import { formatUnitCost } from './units'
import { formatMoney } from '@/services/format'

interface RecipeLineRowProps {
  readonly index: number
  readonly ingredient: RecipeIngredient
  readonly field: UseFormRegisterReturn
  readonly cost: number
  readonly error?: string | undefined
  readonly readOnly: boolean
  readonly onRemove: () => void
}

/** Un insumo de la receta: cuánto lleva una porción y cuánto cuesta eso. */
export function RecipeLineRow({
  index,
  ingredient,
  field,
  cost,
  error,
  readOnly,
  onRemove,
}: RecipeLineRowProps) {
  const id = `recipe-line-${String(index)}`

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[minmax(0,1fr)_11rem_7rem_auto]">
      <div className="flex min-w-0 flex-col">
        <label htmlFor={id} className="font-medium">
          {ingredient.name}
        </label>
        <span className="text-sm text-muted-foreground">{formatUnitCost(ingredient.unitCost, ingredient.unit)}</span>
      </div>
      <RecipeQuantityInput id={id} field={field} unit={ingredient.unit} error={error} readOnly={readOnly} />
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
          <Icon name="delete" size={18} />
        </Button>
      )}
    </li>
  )
}
