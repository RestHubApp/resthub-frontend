import type { MenuSection } from '@/api/types'

interface TodaySummaryProps {
  readonly categories: readonly MenuSection[]
}

/**
 * Cuántos platos se pueden pedir hoy y cuáles no.
 *
 * Es lo primero que se revisa por la mañana: de un vistazo se ve si falta
 * marcar algo sin recorrer la carta entera. Se anuncia al cambiar, así quien
 * usa lector de pantalla oye el efecto del interruptor.
 */
export function TodaySummary({ categories }: TodaySummaryProps) {
  const inMenu = categories
    .filter((category) => category.is_active)
    .flatMap((category) => category.items)
    .filter((dish) => dish.is_active)
  const outOfStock = inMenu.filter((dish) => !dish.is_available)
  const available = inMenu.length - outOfStock.length

  return (
    <div
      role="status"
      className="flex flex-col gap-1 rounded-xl bg-card px-5 py-4 ring-1 ring-foreground/10 sm:flex-row sm:items-baseline sm:gap-4"
    >
      <p className="m-0 text-base font-semibold">
        Hoy: {available} de {inMenu.length} platos disponibles
      </p>
      <p className="m-0 text-sm text-muted-foreground">
        {outOfStock.length === 0
          ? 'No hay nada agotado.'
          : `Agotado hoy: ${outOfStock.map((dish) => dish.name).join(', ')}.`}
      </p>
    </div>
  )
}
