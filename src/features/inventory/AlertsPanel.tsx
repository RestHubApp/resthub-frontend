import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { ListSkeleton } from '@/components/ListSkeleton'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/api'
import { IngredientStatus } from './IngredientStatus'
import type { StockAction } from './StockActionDialog'
import { useLowStock } from './useLowStock'
import { formatQuantity } from '@/services/format'

interface AlertsPanelProps {
  readonly canManage: boolean
  readonly onAction: (action: StockAction) => void
}

/** Los insumos por reponer, con lo que falta para llegar al mínimo y la compra a un toque. */
export function AlertsPanel({ canManage, onAction }: AlertsPanelProps) {
  const alerts = useLowStock()

  if (alerts.isError) {
    return (
      <FormMessage tone="error">
        {errorMessage(alerts.error, 'No se pudieron cargar las alertas.')}
      </FormMessage>
    )
  }
  if (alerts.isPending) {
    return (
      <ListSkeleton
        label="Cargando alertas…"
        count={2}
        className="grid gap-3 md:grid-cols-2"
        itemClassName="h-36 rounded-xl"
      />
    )
  }
  if (alerts.data.length === 0) {
    return (
      <EmptyState
        title="Nada por reponer"
        description="Ningún insumo está por debajo de su stock mínimo."
      />
    )
  }

  return (
    <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
      {alerts.data.map((ingredient) => {
        const missing = Number(ingredient.min_stock) - Number(ingredient.stock)
        return (
          <li
            key={ingredient.id}
            className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10"
          >
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
                onClick={() => {
                  onAction({ kind: 'purchase', ingredient })
                }}
              >
                <Icon name="purchase" size={16} />
                <span>Registrar compra</span>
              </Button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
