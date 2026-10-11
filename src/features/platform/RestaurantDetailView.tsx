import { useQuery } from '@tanstack/react-query'
import { useLocation, useParams } from 'react-router'

import { platformRestaurantQuery } from '@/api/platform'
import { BackLink } from '@/components/BackLink'
import { EmptyState } from '@/components/EmptyState'
import { FormMessage } from '@/components/FormMessage'
import { ListSkeleton } from '@/components/ListSkeleton'
import { PageHeader } from '@/components/PageHeader'
import { SectionCard } from '@/components/SectionCard'
import { errorStatus } from '@/services/api'
import { formatDateTime } from '@/services/format'
import { paths } from '@/services/paths'
import { OwnersSection } from './OwnersSection'
import { PlatformQueryError } from './PlatformQueryError'
import { PLATFORM_TIME_ZONE } from './platformTime'
import { staffSummary } from './restaurantList'
import { RestaurantSettingsForm } from './RestaurantSettingsForm'
import { RestaurantStatusBadge } from './RestaurantStatusBadge'
import { RestaurantStatusButton } from './RestaurantStatusButton'

const NOT_FOUND = 404
const BACK = <BackLink to={paths.platform.home} label="Restaurantes" />

function justCreated(status: unknown): boolean {
  return typeof status === 'object' && status !== null && 'created' in status && status.created === true
}

/** La ficha de un restaurante: sus datos, su estado y sus encargados. */
export function RestaurantDetailView() {
  const restaurantId = Number(useParams()['restaurantId'])
  const created = justCreated(useLocation().state)
  const valid = Number.isInteger(restaurantId) && restaurantId > 0
  const card = useQuery({ ...platformRestaurantQuery(restaurantId), enabled: valid })

  if (!valid || errorStatus(card.error) === NOT_FOUND) {
    return (
      <div className="flex flex-col gap-5">
        {BACK}
        <EmptyState title="Este restaurante no existe." description="Revisa el enlace o búscalo en la lista." />
      </div>
    )
  }
  if (card.isError) {
    return (
      <div className="flex flex-col gap-5">
        {BACK}
        <PlatformQueryError error={card.error} fallback="No se pudo cargar el restaurante." onRetry={() => void card.refetch()} />
      </div>
    )
  }
  if (card.isPending) {
    return <ListSkeleton label="Cargando el restaurante…" count={3} itemClassName="h-32 rounded-xl" />
  }

  const restaurant = card.data
  return (
    <div className="flex flex-col gap-6">
      {BACK}
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
      {created ? <FormMessage tone="ok">Restaurante creado. Su encargado ya puede entrar con su correo.</FormMessage> : null}
      <SectionCard title="Datos del restaurante">
        <RestaurantSettingsForm restaurant={restaurant} />
      </SectionCard>
      <SectionCard
        title={restaurant.is_active ? 'Restaurante activo' : 'Restaurante desactivado'}
        description={
          restaurant.is_active
            ? 'Su personal puede entrar y trabajar con normalidad.'
            : 'Nadie de su personal puede entrar. Sus datos se conservan.'
        }
      >
        <RestaurantStatusButton restaurant={restaurant} />
      </SectionCard>
      <OwnersSection restaurant={restaurant} />
    </div>
  )
}
