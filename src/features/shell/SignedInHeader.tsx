import { paths } from '@/services/paths'
import { Brand } from './Brand'
import { RestaurantName } from './RestaurantName'

/** La cabecera del celular: la marca y el nombre del restaurante. En pantallas anchas se oculta. */
export function SignedInHeader({ restaurantName }: { readonly restaurantName: string }) {
  return (
    <header className="sticky top-[var(--preview-banner-h,0px)] z-30 flex items-center gap-3 border-b bg-card px-4 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 lg:hidden">
      <Brand to={paths.home} compact />
      <RestaurantName name={restaurantName} variant="header" />
    </header>
  )
}
