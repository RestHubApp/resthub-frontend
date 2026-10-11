import { Link } from 'react-router'

import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { LiveIndicator } from './LiveIndicator'
import type { LiveStatus } from './useLiveUpdates'

interface BoardHeaderActionsProps {
  readonly live: LiveStatus
}

/** El estado del canal en vivo y el acceso al historial, en la cabecera del tablero. */
export function BoardHeaderActions({ live }: BoardHeaderActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <LiveIndicator status={live} />
      <Button asChild variant="outline" size="lg" className="h-11 px-4">
        <Link to={paths.board.history}>
          <Icon name="history" size={18} />
          <span>Historial</span>
        </Link>
      </Button>
    </div>
  )
}
