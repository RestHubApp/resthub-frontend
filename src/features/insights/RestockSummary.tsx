import type { RestockAction } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/ui/badge'
import { ACTION_LABELS, ACTION_ORDER, ACTION_STYLES } from './restockActions'

interface RestockSummaryProps {
  readonly counts: Readonly<Partial<Record<string, number>>>
  readonly selected: RestockAction | null
  readonly onSelect: (action: RestockAction | null) => void
}

/**
 * Cuántos insumos caen en cada acción. Cada tarjeta es también un filtro:
 * tocarla deja solo esos insumos en la lista; tocarla de nuevo, todos.
 */
export function RestockSummary({ counts, selected, onSelect }: RestockSummaryProps) {
  return (
    <section aria-label="Resumen por acción" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ACTION_ORDER.map((action) => {
        const style = ACTION_STYLES[action]
        const isActive = selected === action
        return (
          <button
            key={action}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              onSelect(isActive ? null : action)
            }}
            className={`flex flex-col items-start gap-2 rounded-xl bg-card p-4 text-left ring-1 outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50 ${isActive ? 'ring-2 ring-foreground' : 'ring-foreground/10 hover:ring-foreground/30'}`}
          >
            <Badge variant={style.variant} className="font-semibold">
              <Icon name={style.icon} size={14} />
              {ACTION_LABELS[action]}
            </Badge>
            <span className="text-3xl leading-none font-semibold">{counts[action] ?? 0}</span>
            <span className="text-xs text-muted-foreground">{isActive ? 'Mostrando solo estos' : 'insumos'}</span>
          </button>
        )
      })}
    </section>
  )
}
