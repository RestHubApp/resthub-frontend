import type { PlatformRestaurantDetail } from '@/api/types'
import { EmptyState } from '@/components/EmptyState'
import { OwnerRow } from './OwnerRow'

interface OwnersListProps {
  readonly restaurantId: number
  readonly owners: PlatformRestaurantDetail['owners']
}

/** La lista de encargados de un restaurante, o el aviso de que no tiene ninguno. */
export function OwnersList({ restaurantId, owners }: OwnersListProps) {
  if (owners.length === 0) {
    return <EmptyState title="Este restaurante no tiene encargados." description="Agrega uno para que alguien pueda administrarlo." />
  }

  return (
    <ul className="m-0 flex list-none flex-col divide-y p-0">
      {owners.map((owner) => <OwnerRow key={owner.id} restaurantId={restaurantId} owner={owner} />)}
    </ul>
  )
}
