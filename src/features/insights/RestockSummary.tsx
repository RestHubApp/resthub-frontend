import type { RestockAction } from '../../api/types'
import Icon from '../../components/Icon'
import { ACTION_LABELS, ACTION_ORDER, ACTION_STYLES, TONE_BADGE } from './restockActions'

interface RestockSummaryProps {
  readonly counts: Readonly<Partial<Record<string, number>>>
  readonly selected: RestockAction | null
  readonly onSelect: (action: RestockAction | null) => void
}

/**
 * Cuántos insumos caen en cada acción. Cada tarjeta es también un filtro:
 * tocarla deja solo esos insumos en la lista; tocarla de nuevo, todos.
 */
export default function RestockSummary({ counts, selected, onSelect }: RestockSummaryProps) {
  return (
    <section aria-label="Resumen por acción" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {ACTION_ORDER.map((action) => {
        const estilo = ACTION_STYLES[action]
        const activo = selected === action
        return (
          <button
            key={action}
            type="button"
            aria-pressed={activo}
            onClick={() => {
              onSelect(activo ? null : action)
            }}
            className={`flex flex-col items-start gap-2 rounded-xl bg-card p-4 text-left ring-1 outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50 ${activo ? 'ring-2 ring-foreground' : 'ring-foreground/10 hover:ring-foreground/30'}`}
          >
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TONE_BADGE[estilo.tone]}`}>
              <Icon name={estilo.icon} size={14} />
              {ACTION_LABELS[action]}
            </span>
            <span className="text-3xl leading-none font-semibold">{counts[action] ?? 0}</span>
            <span className="text-xs text-muted-foreground">{activo ? 'Mostrando solo estos' : 'insumos'}</span>
          </button>
        )
      })}
    </section>
  )
}
