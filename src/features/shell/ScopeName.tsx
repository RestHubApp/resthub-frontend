import { ShellIcon } from './ShellIcon'

interface ScopeNameProps {
  readonly name: string
  /** `sidebar` es la tarjeta de escritorio; `header`, la barra del celular. */
  readonly variant: 'sidebar' | 'header'
  /** Lo que el lector de pantalla dice antes del nombre: «Restaurante: ». Sin él, solo el nombre. */
  readonly spokenLabel?: string | undefined
}

/**
 * Dónde trabaja la cuenta: su restaurante, o la administración del sistema.
 *
 * RestHub atiende a varios restaurantes, pero cada persona trabaja en uno: su
 * nombre a la vista confirma donde se esta cargando cada pedido. La cuenta de
 * plataforma no es de ningún local y ve «Administración del sistema».
 */
export function ScopeName({ name, variant, spokenLabel }: ScopeNameProps) {
  const prefix = spokenLabel === undefined ? null : <span className="sr-only">{spokenLabel}: </span>
  if (variant === 'header') {
    return (
      <p className="m-0 min-w-0 flex-1 truncate font-heading text-base font-semibold text-foreground">
        {prefix}
        {name}
      </p>
    )
  }
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-secondary px-3 py-2.5 text-secondary-foreground">
      <ShellIcon className="shrink-0" name="restaurant" size={18} />
      <p className="m-0 min-w-0 text-sm leading-snug font-semibold text-pretty break-words">
        {prefix}
        {name}
      </p>
    </div>
  )
}
