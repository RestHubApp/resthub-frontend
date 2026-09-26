import type { ReactNode } from 'react'

interface LoadingRegionProps {
  /** Lo que oye el lector de pantalla mientras carga: "Cargando pedidos…". */
  readonly label: string
  /** La silueta de lo que viene. Es decorado: el lector de pantalla no la recorre. */
  readonly children: ReactNode
  /** La disposición de la silueta. */
  readonly className?: string
}

/**
 * Un contenido que todavía está cargando, con la forma que va a tener.
 *
 * Reserva el lugar para que la pantalla no salte cuando llegan los datos, y
 * anuncia la carga con texto: la silueta sola no le dice nada a quien no ve.
 */
export default function LoadingRegion({ label, children, className }: LoadingRegionProps) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className={className}>
        {children}
      </div>
    </div>
  )
}
