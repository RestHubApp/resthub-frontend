import type { Ingredient } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { formatQuantity } from '@/services/format'
import { IngredientStatus } from './IngredientStatus'

interface AlertCardProps {
  readonly ingredient: Ingredient
  readonly canManage: boolean
  /** Se llama al pedir registrar la compra de este insumo. */
  readonly onPurchase: () => void
}

/** Un insumo por reponer: cuánto hay, el mínimo, lo que falta y la compra a un toque. */
export function AlertCard({ ingredient, canManage, onPurchase }: AlertCardProps) {
  const missing = Number(ingredient.min_stock) - Number(ingredient.stock)

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-base font-semibold">{ingredient.name}</h2>
        <IngredientStatus ingredient={ingredient} />
      </div>
      <p className="m-0 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
        <span>
          Hay{' '}
          <strong className={ingredient.is_negative ? 'text-destructive' : 'text-foreground'}>
            {formatQuantity(ingredient.stock, ingredient.unit)}
          </strong>
        </span>
        <span>Mínimo {formatQuantity(ingredient.min_stock, ingredient.unit)}</span>
        <span>
          Faltan <strong className="text-foreground">{formatQuantity(missing, ingredient.unit)}</strong>
        </span>
      </p>
      {canManage ? (
        <Button
          type="button"
          variant="secondary"
          className="h-11 self-start px-4"
          aria-label={`Registrar compra de ${ingredient.name}`}
          onClick={onPurchase}
        >
          <Icon name="purchase" size={16} />
          <span>Registrar compra</span>
        </Button>
      ) : null}
    </li>
  )
}
