import type { RestockAction } from '../../api/types'
import Icon from '../../components/Icon'
import { ACTION_STYLES, TONE_BADGE } from './restockActions'

interface ActionBadgeProps {
  readonly action: RestockAction
  readonly label: string
}

/** La acción sugerida, con ícono y texto: el color nunca va solo. */
export default function ActionBadge({ action, label }: ActionBadgeProps) {
  const estilo = ACTION_STYLES[action]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TONE_BADGE[estilo.tone]}`}>
      <Icon name={estilo.icon} size={14} />
      {label}
    </span>
  )
}
