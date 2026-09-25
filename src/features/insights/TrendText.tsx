import type { RestockItem } from '../../api/types'
import Icon from '../../components/Icon'
import type { IconName } from '../../components/icons'
import { formatChange } from './format'

const TREND_ICONS: Partial<Record<string, IconName>> = {
  rising: 'tendenciaSube',
  falling: 'tendenciaBaja',
  stable: 'tendenciaEstable',
}

/** La tendencia del consumo: la última semana contra las cuatro anteriores. */
export default function TrendText({ item }: { readonly item: RestockItem }) {
  const icono = TREND_ICONS[item.trend]
  return (
    <span className="inline-flex items-center gap-1">
      {icono === undefined ? null : <Icon name={icono} size={14} />}
      {item.trend_label}
      {item.usage_change_percent === null ? null : (
        <span className="text-muted-foreground">({formatChange(item.usage_change_percent)})</span>
      )}
    </span>
  )
}
