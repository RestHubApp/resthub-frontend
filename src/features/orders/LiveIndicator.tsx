import { Icon } from '@/components/Icon'
import { Badge, type BadgeVariant } from '@/components/ui/badge'
import type { LiveStatus } from '@/store/liveStatus'

interface LiveIndicatorProps {
  readonly status: LiveStatus
}

const COPY: Record<LiveStatus, { label: string; variant: BadgeVariant }> = {
  connecting: { label: 'Conectando…', variant: 'muted' },
  live: { label: 'En vivo', variant: 'success' },
  offline: { label: 'Sin conexión · reintentando', variant: 'warning' },
}

/**
 * Si la pantalla se esta actualizando sola.
 *
 * Quien mira el tablero tiene que saber si puede confiar en lo que ve sin
 * recargar. Se anuncia con `role="status"` para que el lector de pantalla
 * avise cuando se corta o vuelve.
 */
export function LiveIndicator({ status }: LiveIndicatorProps) {
  const { label, variant } = COPY[status]

  return (
    <Badge asChild variant={variant} className="m-0 h-auto min-h-8 gap-2 px-3 text-sm whitespace-normal">
      <p role="status">
        {status === 'live' ? (
          <span aria-hidden="true" className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex size-2.5 rounded-full bg-success" />
          </span>
        ) : (
          <Icon name={status === 'offline' ? 'offline' : 'live'} size={16} />
        )}
        <span>{label}</span>
      </p>
    </Badge>
  )
}
