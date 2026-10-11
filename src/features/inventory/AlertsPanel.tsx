import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { errorMessage } from '@/services/apiError'
import { AlertCard } from './AlertCard'
import type { StockAction } from './StockActionDialog'
import { useLowStock } from './useLowStock'

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
      {alerts.data.map((ingredient) => (
        <AlertCard
          key={ingredient.id}
          ingredient={ingredient}
          canManage={canManage}
          onPurchase={() => {
            onAction({ kind: 'purchase', ingredient })
          }}
        />
      ))}
    </ul>
  )
}
