import type { MenuSection } from '../../api/types'

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
export default function TodaySummary({ categories }: TodaySummaryProps) {
  const enCarta = categories
    .filter((categoria) => categoria.is_active)
    .flatMap((categoria) => categoria.items)
    .filter((plato) => plato.is_active)
  const agotados = enCarta.filter((plato) => !plato.is_available)
  const disponibles = enCarta.length - agotados.length

  return (
    <div
      role="status"
      className="flex flex-col gap-1 rounded-xl bg-card px-5 py-4 shadow-sm ring-1 ring-foreground/10 sm:flex-row sm:items-baseline sm:gap-4"
    >
      <p className="m-0 text-base font-semibold">
        Hoy: {disponibles} de {enCarta.length} platos disponibles
      </p>
      <p className="m-0 text-sm text-muted-foreground">
        {agotados.length === 0
          ? 'No hay nada agotado.'
          : `Agotado hoy: ${agotados.map((plato) => plato.name).join(', ')}.`}
      </p>
    </div>
  )
}
