import type { PlatformRestaurantDetail } from '@/api/types'
import { SectionCard } from '@/components/SectionCard'
import { RestaurantStatusButton } from './RestaurantStatusButton'

interface RestaurantStatusCardProps {
  readonly restaurant: PlatformRestaurantDetail
}

/** La tarjeta que dice si el restaurante está activo y deja cambiarlo. */
export function RestaurantStatusCard({ restaurant }: RestaurantStatusCardProps) {
  return (
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
  )
}
