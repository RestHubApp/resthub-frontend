import type { PlatformRestaurantDetail } from '@/api/types'
import { PageHeader } from '@/components/PageHeader'
import { formatDateTime } from '@/services/format'
import { PLATFORM_TIME_ZONE } from './platformTime'
import { staffSummary } from './restaurantList'
import { RestaurantStatusBadge } from './RestaurantStatusBadge'

interface RestaurantHeaderProps {
  readonly restaurant: PlatformRestaurantDetail
}

/** El encabezado de la ficha: nombre, identificador, estado, alta y personal. */
export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  return (
    <PageHeader
      title={restaurant.name}
      description={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <code className="text-sm">{restaurant.slug}</code>
          <RestaurantStatusBadge active={restaurant.is_active} />
          <span>Alta: {formatDateTime(restaurant.created_at, PLATFORM_TIME_ZONE)}</span>
          <span>Personal: {staffSummary(restaurant.active_staff_count, restaurant.staff_count)}</span>
        </span>
      }
    />
  )
}
