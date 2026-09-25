import type { RestockItem } from '../../api/types'
import ActionBadge from './ActionBadge'
import EngineBadge from './EngineBadge'
import { formatConfidence, formatDays, formatPercent, formatQuantity } from './format'
import Metric from './Metric'
import TrendText from './TrendText'
import UrgencyMeter from './UrgencyMeter'

interface RestockItemCardProps {
  readonly item: RestockItem
}

/**
 * La recomendación para un insumo: qué hacer, por qué (en palabras), con qué
 * urgencia y confianza, y quién lo decidió. Los números que la sostienen van
 * abajo para que el encargado pueda no estar de acuerdo.
 */
export default function RestockItemCard({ item }: RestockItemCardProps) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="m-0 text-base font-semibold">{item.name}</h3>
          <EngineBadge engine={item.engine} fallbackReason={item.fallback_reason} fallbackLabel={item.fallback_label} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <UrgencyMeter urgency={item.urgency} label={`Urgencia ${item.urgency_label.toLowerCase()}`} />
          <ActionBadge action={item.action} label={item.action_label} />
        </div>
      </div>
      <p className="m-0 text-sm leading-relaxed">{item.explanation}</p>
      <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Stock / mínimo">
          {`${formatQuantity(item.stock, item.unit)} / ${formatQuantity(item.min_stock, item.unit)}`}
        </Metric>
        <Metric label="Cobertura">{item.coverage_days === null ? 'Sin consumo' : formatDays(item.coverage_days)}</Metric>
        <Metric label="Consumo diario (7 días)">{formatQuantity(item.daily_use_7d, item.unit)}</Metric>
        <Metric label="Tendencia">
          <TrendText item={item} />
        </Metric>
        <Metric label="Merma (4 semanas)">{formatPercent(item.waste_share_percent)}</Metric>
        <Metric label="Confianza">{item.engine === 'rules' && item.confidence === null ? 'Regla fija' : formatConfidence(item.confidence)}</Metric>
      </dl>
    </li>
  )
}
