import { Link } from 'react-router'

import RestHubMark from './RestHubMark'

interface BrandProps {
  readonly to: string
  /** Solo el isotipo, para la barra del celular, donde manda el restaurante. */
  readonly compact?: boolean
}

export default function Brand({ to, compact = false }: BrandProps) {
  return (
    <Link
      to={to}
      aria-label="RestHub, ir al inicio"
      className="inline-flex shrink-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <RestHubMark size={compact ? 36 : 34} />
      {compact ? null : (
        <span aria-hidden="true" className="font-heading text-xl font-black tracking-tight">
          <span className="text-foreground">Rest</span>
          <span className="text-primary">Hub</span>
        </span>
      )}
    </Link>
  )
}
