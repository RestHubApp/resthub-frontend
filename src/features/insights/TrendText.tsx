import type { RestockItem } from '@/api/types'
import { Icon, type IconGlyph } from '@/components/Icon'
import * as icons from '@/components/icons'
import { formatChange } from '@/services/format'

const TREND_ICONS: Partial<Record<string, IconGlyph>> = {
  rising: icons.trendRises,
  falling: icons.trendFalls,
  stable: icons.trendStable,
}

/** La tendencia del consumo: la última semana contra las cuatro anteriores. */
export function TrendText({ item }: { readonly item: RestockItem }) {
  const icon = TREND_ICONS[item.trend]
  return (
    <span className="inline-flex items-center gap-1">
      {icon === undefined ? null : <Icon glyph={icon} size={14} />}
      {item.trend_label}
      {item.usage_change_percent === null ? null : (
        <span className="text-muted-foreground">({formatChange(item.usage_change_percent)})</span>
      )}
    </span>
  )
}
