import type { PlatformRestaurantDetail } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { StatusBadge } from '@/components/StatusBadge'

interface OwnersListProps {
  readonly owners: PlatformRestaurantDetail['owners']
}

/** La lista de encargados de un restaurante, o el aviso de que no tiene ninguno. */
export function OwnersList({ owners }: OwnersListProps) {
  if (owners.length === 0) {
    return <EmptyState title="Este restaurante no tiene encargados." description="Agrega uno para que alguien pueda administrarlo." />
  }

  return (
    <ul className="m-0 flex list-none flex-col divide-y p-0">
      {owners.map((owner) => (
        <li key={owner.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
          <span className="flex min-w-0 flex-col">
            <span className="font-medium break-words">{owner.full_name}</span>
            <span className="text-sm break-all text-muted-foreground">{owner.email}</span>
          </span>
          <StatusBadge
            label={owner.is_active ? 'Activa' : 'Inactiva'}
            tone={owner.is_active ? 'completed' : undefined}
          />
        </li>
      ))}
    </ul>
  )
}
