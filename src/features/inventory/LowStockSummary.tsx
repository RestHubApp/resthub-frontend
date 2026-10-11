import { cn } from 'cn'

import { Icon } from '@/components/Icon'
import { ListSkeleton } from '@/components/ListSkeleton'
import { Button } from '@/components/ui/button'
import { useLowStock } from './useLowStock'

interface LowStockSummaryProps {
  readonly onShowAlerts: () => void
}

const MAX_NAMES = 4

function list(names: readonly string[]): string {
  const first = names.slice(0, MAX_NAMES).join(', ')
  const rest = names.length - MAX_NAMES
  return rest > 0 ? `${first} y ${String(rest)} más` : first
}

function holder(low: number, negative: number): string {
  if (low === 0) {
    return 'Stock en orden: nada por debajo del mínimo.'
  }
  const howMany = low === 1 ? '1 insumo por reponer' : `${String(low)} insumos por reponer`
  return negative > 0 ? `${howMany}, ${String(negative)} en negativo` : howMany
}

/**
 * Lo primero que se ve al entrar al inventario: qué hay que reponer.
 *
 * Se anuncia al cambiar, así registrar una compra que saca un insumo de la
 * lista se oye también con lector de pantalla.
 */
export function LowStockSummary({ onShowAlerts }: LowStockSummaryProps) {
  const alerts = useLowStock()
  if (alerts.isPending) {
    return <ListSkeleton label="Revisando el stock…" count={1} itemClassName="h-19 rounded-xl" />
  }
  if (alerts.data === undefined) {
    return null
  }
  const low = alerts.data
  const negative = low.filter((ingredient) => ingredient.is_negative).length

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col gap-3 rounded-xl px-5 py-4 ring-1 sm:flex-row sm:items-center sm:justify-between',
        low.length === 0 ? 'bg-success/10 ring-success/20' : 'bg-warning/10 ring-warning/25',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          name={low.length === 0 ? 'confirm' : 'notice'}
          size={22}
          className={cn('mt-0.5 shrink-0', low.length === 0 ? 'text-success' : 'text-warning')}
        />
        <div className="flex flex-col gap-0.5">
          <p className="m-0 font-semibold">
            {holder(low.length, negative)}
          </p>
          {low.length === 0 ? null : (
            <p className="m-0 text-sm text-muted-foreground">{list(low.map((ingredient) => ingredient.name))}</p>
          )}
        </div>
      </div>
      {low.length === 0 ? null : (
        <Button type="button" variant="outline" className="h-11 px-4" onClick={onShowAlerts}>
          <Icon name="notice" size={16} />
          <span>Ver alertas</span>
        </Button>
      )}
    </div>
  )
}
