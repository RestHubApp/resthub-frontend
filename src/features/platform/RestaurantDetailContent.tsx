import type { PlatformRestaurantDetail } from '@/api/types'
import { BackLink } from '@/components/BackLink'
import { FormMessage } from '@/components/FormMessage'
import { SectionCard } from '@/components/SectionCard'
import { paths } from '@/services/paths'
import { OwnersSection } from './OwnersSection'
import { RestaurantHeader } from './RestaurantHeader'
import { RestaurantSettingsForm } from './RestaurantSettingsForm'
import { RestaurantStatusCard } from './RestaurantStatusCard'

interface RestaurantDetailContentProps {
  readonly restaurant: PlatformRestaurantDetail
  /** Se llegó recién del alta: se da la bienvenida. */
  readonly wasCreated: boolean
}

/** El cuerpo de la ficha de un restaurante ya cargado: datos, estado y encargados. */
export function RestaurantDetailContent({ restaurant, wasCreated }: RestaurantDetailContentProps) {
  return (
    <div className="flex flex-col gap-6">
      <BackLink to={paths.platform.home} label="Restaurantes" />
      <RestaurantHeader restaurant={restaurant} />
      {wasCreated ? <FormMessage tone="ok">Restaurante creado. Su encargado ya puede entrar con su correo.</FormMessage> : null}
      <SectionCard title="Datos del restaurante">
        <RestaurantSettingsForm restaurant={restaurant} />
      </SectionCard>
      <RestaurantStatusCard restaurant={restaurant} />
      <OwnersSection restaurant={restaurant} />
    </div>
  )
}
