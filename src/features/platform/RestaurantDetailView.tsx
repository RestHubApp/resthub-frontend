import { useQuery } from '@tanstack/react-query'
import { useLocation, useParams } from 'react-router'

import { platformRestaurantQuery } from '../../api/platform'
import BackLink from '../../components/BackLink'
import EmptyState from '../../components/EmptyState'
import FormMessage from '../../components/FormMessage'
import ListSkeleton from '../../components/ListSkeleton'
import PageHeader from '../../components/PageHeader'
import SectionCard from '../../components/SectionCard'
import { errorStatus } from '../../services/api'
import { formatDateTime } from '../../services/format'
import OwnersSection from './OwnersSection'
import PlatformQueryError from './PlatformQueryError'
import { PLATFORM_TIME_ZONE } from './platformTime'
import { staffSummary } from './restaurantList'
import RestaurantSettingsForm from './RestaurantSettingsForm'
import RestaurantStatusBadge from './RestaurantStatusBadge'
import RestaurantStatusButton from './RestaurantStatusButton'

const NOT_FOUND = 404
const VOLVER = <BackLink to="/plataforma" label="Restaurantes" />

function recienCreado(estado: unknown): boolean {
  return typeof estado === 'object' && estado !== null && 'created' in estado && estado.created === true
}

/** La ficha de un restaurante: sus datos, su estado y sus encargados. */
export default function RestaurantDetailView() {
  const restaurantId = Number(useParams().restaurantId)
  const creado = recienCreado(useLocation().state)
  const valido = Number.isInteger(restaurantId) && restaurantId > 0
  const ficha = useQuery({ ...platformRestaurantQuery(restaurantId), enabled: valido })

  if (!valido || errorStatus(ficha.error) === NOT_FOUND) {
    return (
      <div className="flex flex-col gap-5">
        {VOLVER}
        <EmptyState title="Este restaurante no existe." description="Revisa el enlace o búscalo en la lista." />
      </div>
    )
  }
  if (ficha.isError) {
    return (
      <div className="flex flex-col gap-5">
        {VOLVER}
        <PlatformQueryError error={ficha.error} fallback="No se pudo cargar el restaurante." onRetry={() => void ficha.refetch()} />
      </div>
    )
  }
  if (ficha.isPending) {
    return <ListSkeleton label="Cargando el restaurante…" count={3} itemClassName="h-32 rounded-xl" />
  }

  const restaurante = ficha.data
  return (
    <div className="flex flex-col gap-6">
      {VOLVER}
      <PageHeader
        title={restaurante.name}
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <code className="text-sm">{restaurante.slug}</code>
            <RestaurantStatusBadge active={restaurante.is_active} />
            <span>Alta: {formatDateTime(restaurante.created_at, PLATFORM_TIME_ZONE)}</span>
            <span>Personal: {staffSummary(restaurante.active_staff_count, restaurante.staff_count)}</span>
          </span>
        }
      />
      {creado ? <FormMessage tone="ok">Restaurante creado. Su encargado ya puede entrar con su correo.</FormMessage> : null}
      <SectionCard title="Datos del restaurante">
        <RestaurantSettingsForm restaurant={restaurante} />
      </SectionCard>
      <SectionCard
        title={restaurante.is_active ? 'Restaurante activo' : 'Restaurante desactivado'}
        description={
          restaurante.is_active
            ? 'Su personal puede entrar y trabajar con normalidad.'
            : 'Nadie de su personal puede entrar. Sus datos se conservan.'
        }
      >
        <RestaurantStatusButton restaurant={restaurante} />
      </SectionCard>
      <OwnersSection restaurant={restaurante} />
    </div>
  )
}
