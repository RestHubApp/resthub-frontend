import Icon from '../../components/Icon'

interface RestaurantNameProps {
  readonly name: string
  /** `sidebar` es la tarjeta de escritorio; `header`, la barra del celular. */
  readonly variant: 'sidebar' | 'header'
}

/**
 * El restaurante de la cuenta.
 *
 * RestHub atiende a varios restaurantes, pero cada persona trabaja en uno: su
 * nombre a la vista confirma donde se esta cargando cada pedido.
 */
export default function RestaurantName({ name, variant }: RestaurantNameProps) {
  if (variant === 'header') {
    return (
      <p className="m-0 min-w-0 flex-1 truncate font-heading text-base font-semibold text-foreground">
        <span className="sr-only">Restaurante: </span>
        {name}
      </p>
    )
  }
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-secondary px-3 py-2.5 text-secondary-foreground">
      <Icon className="shrink-0" name="restaurante" size={18} />
      <p className="m-0 min-w-0 text-sm leading-snug font-semibold text-pretty break-words">
        <span className="sr-only">Restaurante: </span>
        {name}
      </p>
    </div>
  )
}
