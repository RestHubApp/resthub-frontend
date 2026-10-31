import { Link } from 'react-router'

import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { LiveIndicator } from './LiveIndicator'
import type { LiveStatus } from '@/store/liveStatus'

interface BoardHeaderActionsProps {
  readonly live: LiveStatus
}

/** El estado del canal en vivo y el acceso al historial, en la cabecera del tablero. */
export function BoardHeaderActions({ live }: BoardHeaderActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LiveIndicator status={live} />
      <Button asChild variant="outline">
        <Link to={paths.board.history}>
          <Icon glyph={icons.history} size={18} />
          <span>Historial</span>
        </Link>
      </Button>
    </div>
  )
}
