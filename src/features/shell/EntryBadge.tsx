import { Suspense } from 'react'

import type { NavEntry } from './navigation'

interface EntryBadgeProps {
  readonly entry: NavEntry
  /** En la barra de abajo, el contador va sobre el ícono, en la esquina. */
  readonly isFloating?: boolean
}

/** El contador de una entrada del menú, si tiene: se baja aparte y, mientras tanto, no ocupa lugar. */
export function EntryBadge({ entry, isFloating = false }: EntryBadgeProps) {
  const Badge = entry.badge
  if (Badge === undefined) {
    return null
  }
  return (
    <Suspense fallback={null}>
      {isFloating ? (
        <span className="absolute top-1 left-1/2 ml-2">
          <Badge />
        </span>
      ) : (
        <Badge />
      )}
    </Suspense>
  )
}
