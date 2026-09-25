import Icon from '../../components/Icon'
import type { LiveStatus } from './useLiveUpdates'

interface LiveIndicatorProps {
  readonly status: LiveStatus
}

const COPY: Record<LiveStatus, { label: string; className: string }> = {
  connecting: { label: 'Conectando…', className: 'bg-muted text-muted-foreground' },
  live: { label: 'En vivo', className: 'bg-success/10 text-success' },
  offline: { label: 'Sin conexión · reintentando', className: 'bg-warning/10 text-warning' },
}

/**
 * Si la pantalla se esta actualizando sola.
 *
 * Quien mira el tablero tiene que saber si puede confiar en lo que ve sin
 * recargar. Se anuncia con `role="status"` para que el lector de pantalla
 * avise cuando se corta o vuelve.
 */
export default function LiveIndicator({ status }: LiveIndicatorProps) {
  const { label, className } = COPY[status]

  return (
    <p
      role="status"
      className={`m-0 inline-flex min-h-8 items-center gap-2 rounded-full px-3 text-sm font-medium ${className}`}
    >
      {status === 'live' ? (
        <span aria-hidden="true" className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
      ) : (
        <Icon name={status === 'offline' ? 'sinConexion' : 'enVivo'} size={16} />
      )}
      <span>{label}</span>
    </p>
  )
}
