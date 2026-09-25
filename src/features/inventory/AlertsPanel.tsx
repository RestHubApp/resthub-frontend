import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import IngredientStatus from './IngredientStatus'
import type { StockAction } from './StockActionDialog'
import { formatQuantity } from './units'
import { useLowStock } from './useLowStock'

interface AlertsPanelProps {
  readonly canManage: boolean
  readonly onAction: (action: StockAction) => void
}

/** Los insumos por reponer, con lo que falta para llegar al mínimo y la compra a un toque. */
export default function AlertsPanel({ canManage, onAction }: AlertsPanelProps) {
  const alertas = useLowStock()

  if (alertas.isError) {
    return (
      <FormMessage tone="error">
        {errorMessage(alertas.error, 'No se pudieron cargar las alertas.')}
      </FormMessage>
    )
  }
  if (alertas.isPending) {
    return <EmptyState title="Cargando alertas…" />
  }
  if (alertas.data.length === 0) {
    return (
      <EmptyState
        title="Nada por reponer"
        description="Ningún insumo está por debajo de su stock mínimo."
      />
    )
  }

  return (
    <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2">
      {alertas.data.map((insumo) => {
        const falta = Number(insumo.min_stock) - Number(insumo.stock)
        return (
          <li
            key={insumo.id}
            className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="m-0 text-base font-semibold">{insumo.name}</h3>
              <IngredientStatus ingredient={insumo} />
            </div>
            <p className="m-0 text-sm text-muted-foreground">
              Hay <strong className={insumo.is_negative ? 'text-destructive' : 'text-foreground'}>{formatQuantity(insumo.stock, insumo.unit)}</strong>
              {' '}de un mínimo de {formatQuantity(insumo.min_stock, insumo.unit)}. Faltan{' '}
              <strong className="text-foreground">{formatQuantity(falta, insumo.unit)}</strong> para llegar.
            </p>
            {canManage ? (
              <Button
                type="button"
                variant="secondary"
                className="h-11 self-start px-4"
                aria-label={`Registrar compra de ${insumo.name}`}
                onClick={() => {
                  onAction({ kind: 'purchase', ingredient: insumo })
                }}
              >
                <Icon name="compra" size={16} />
                <span>Registrar compra</span>
              </Button>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
