interface RestHubMarkProps {
  readonly size?: number
  readonly className?: string
}

/**
 * El isotipo de RestHub: la campana con que se sirve un plato.
 *
 * Es el mismo dibujo que public/favicon.svg y que los iconos de la aplicacion
 * instalada. Va en linea y no como imagen para heredar el color de la marca
 * sin una peticion mas. Siempre acompana al nombre, asi que es decorativo.
 */
export default function RestHubMark({ size = 32, className = '' }: RestHubMarkProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      <rect width="64" height="64" rx="14" className="fill-primary" />
      <g className="fill-primary-foreground">
        <circle cx="32" cy="19.5" r="3.2" />
        <path d="M13.5 41.5a18.5 18.5 0 0 1 37 0z" />
        <rect x="9.5" y="44" width="45" height="4.5" rx="2.25" />
      </g>
    </svg>
  )
}
