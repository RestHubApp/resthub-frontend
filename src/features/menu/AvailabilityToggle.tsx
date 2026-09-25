import { cn } from 'cn'

import { setAvailability } from '../../api/menu'
import type { MenuItem } from '../../api/types'
import { patchItem } from './menuCache'
import { useMenuChange } from './useMenuChange'

interface AvailabilityToggleProps {
  readonly item: MenuItem
}

interface AvailabilityVars {
  readonly id: number
  readonly isAvailable: boolean
}

/**
 * El interruptor "Disponible hoy" de un plato.
 *
 * Es lo que más se toca cada mañana ("hoy no hay ceviche"), así que es grande,
 * se entiende sin leer y responde al instante. Es un interruptor de verdad
 * (`role="switch"`): el lector de pantalla anuncia si está encendido. El texto
 * visible no cambia y forma parte del nombre accesible; el estado lo dicen el
 * interruptor y la etiqueta "Agotado hoy" del plato.
 */
export default function AvailabilityToggle({ item }: AvailabilityToggleProps) {
  const cambio = useMenuChange<AvailabilityVars>({
    send: ({ id, isAvailable }) => setAvailability(id, isAvailable),
    preview: (menu, { id, isAvailable }) => patchItem(menu, id, { is_available: isAvailable }),
    failure: `No se pudo cambiar la disponibilidad de ${item.name}.`,
  })
  const encendido = item.is_available

  return (
    <button
      type="button"
      role="switch"
      aria-checked={encendido}
      aria-label={`Disponible hoy: ${item.name}`}
      onClick={() => {
        cambio.mutate({ id: item.id, isAvailable: !encendido })
      }}
      className={cn(
        'inline-flex h-11 shrink-0 basis-full items-center gap-2.5 rounded-full border px-2 pr-3.5 sm:basis-auto text-sm font-semibold outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        encendido
          ? 'border-success/30 bg-success/10 text-success hover:bg-success/15'
          : 'border-border bg-muted text-muted-foreground hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_6%)]',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors',
          encendido ? 'bg-success' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'absolute left-1 size-5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none',
            encendido ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </span>
      <span>Disponible hoy</span>
    </button>
  )
}
