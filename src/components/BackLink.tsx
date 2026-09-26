import { Link } from 'react-router'

import Icon from './Icon'

interface BackLinkProps {
  readonly to: string
  readonly label?: string
}

/** Volver a la pantalla anterior, con un blanco comodo para el pulgar. */
export default function BackLink({ to, label = 'Volver' }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="-ml-2 inline-flex min-h-11 w-fit items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Icon name="anterior" size={18} />
      <span>{label}</span>
    </Link>
  )
}
