import type { ObsLogLevel } from '../../../api/types'
import StatusBadge from '../../../components/StatusBadge'
import { LEVEL_LABELS } from './obsLabels'

/** El nivel de un log, escrito y con su color: ámbar la advertencia, rojo el error. */
export default function LevelBadge({ level }: { readonly level: ObsLogLevel }) {
  return <StatusBadge label={LEVEL_LABELS[level]} tone={level === 'error' ? 'cancelled' : 'pending'} />
}
