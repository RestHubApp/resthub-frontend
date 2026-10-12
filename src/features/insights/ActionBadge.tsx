import type { RestockAction } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Badge } from '@/components/ui/badge'
import { ACTION_STYLES } from './restockActions'

interface ActionBadgeProps {
  readonly action: RestockAction
  readonly label: string
}

/** La acción sugerida, con ícono y texto: el color nunca va solo. */
export function ActionBadge({ action, label }: ActionBadgeProps) {
  const style = ACTION_STYLES[action]
  return (
    <Badge variant={style.variant} className="font-semibold">
      <Icon name={style.icon} size={14} />
      {label}
    </Badge>
  )
}
