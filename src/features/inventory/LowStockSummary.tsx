import { cn } from 'cn'

import Icon from '../../components/Icon'
import ListSkeleton from '../../components/ListSkeleton'
import { Button } from '../../components/ui/button'
import { useLowStock } from './useLowStock'

interface LowStockSummaryProps {
  readonly onShowAlerts: () => void
}

const MAX_NOMBRES = 4

function lista(nombres: readonly string[]): string {
  const primeros = nombres.slice(0, MAX_NOMBRES).join(', ')
  const resto = nombres.length - MAX_NOMBRES
  return resto > 0 ? `${primeros} y ${String(resto)} más` : primeros
}

function titular(bajos: number, negativos: number): string {
  if (bajos === 0) {
    return 'Stock en orden: nada por debajo del mínimo.'
  }
  const cuantos = bajos === 1 ? '1 insumo por reponer' : `${String(bajos)} insumos por reponer`
  return negativos > 0 ? `${cuantos}, ${String(negativos)} en negativo` : cuantos
}

/**
 * Lo primero que se ve al entrar al inventario: qué hay que reponer.
 *
 * Se anuncia al cambiar, así registrar una compra que saca un insumo de la
 * lista se oye también con lector de pantalla.
 */
export default function LowStockSummary({ onShowAlerts }: LowStockSummaryProps) {
  const alertas = useLowStock()
  if (alertas.isPending) {
    return <ListSkeleton label="Revisando el stock…" count={1} itemClassName="h-19 rounded-xl" />
  }
  if (alertas.data === undefined) {
    return null
  }
  const bajos = alertas.data
  const negativos = bajos.filter((insumo) => insumo.is_negative).length

  return (
    <div
      role="status"
      className={cn(
        'flex flex-col gap-3 rounded-xl px-5 py-4 ring-1 sm:flex-row sm:items-center sm:justify-between',
        bajos.length === 0 ? 'bg-success/10 ring-success/20' : 'bg-warning/10 ring-warning/25',
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          name={bajos.length === 0 ? 'confirmar' : 'aviso'}
          size={22}
          className={cn('mt-0.5 shrink-0', bajos.length === 0 ? 'text-success' : 'text-warning')}
        />
        <div className="flex flex-col gap-0.5">
          <p className="m-0 font-semibold">
            {titular(bajos.length, negativos)}
          </p>
          {bajos.length === 0 ? null : (
            <p className="m-0 text-sm text-muted-foreground">{lista(bajos.map((insumo) => insumo.name))}</p>
          )}
        </div>
      </div>
      {bajos.length === 0 ? null : (
        <Button type="button" variant="outline" className="h-11 px-4" onClick={onShowAlerts}>
          <Icon name="aviso" size={16} />
          <span>Ver alertas</span>
        </Button>
      )}
    </div>
  )
}
