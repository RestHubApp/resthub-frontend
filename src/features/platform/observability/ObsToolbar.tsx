import type { ObsFilters } from './obsFilters'
import RefreshControl from './RefreshControl'
import RestaurantFilter from './RestaurantFilter'
import type { ObsRefresh } from './useObsRefresh'
import WindowPicker from './WindowPicker'

interface ObsToolbarProps {
  readonly filters: ObsFilters
  readonly onChange: (patch: Partial<ObsFilters>) => void
  readonly refresh: ObsRefresh
}

/** Lo que vale para el panel entero: la ventana, el restaurante y la actualización. */
export default function ObsToolbar({ filters, onChange, refresh }: ObsToolbarProps) {
  return (
    <section
      aria-label="Ventana, restaurante y actualización"
      className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10"
    >
      <WindowPicker
        value={filters.window}
        onChange={(window) => {
          onChange({ window })
        }}
      />
      <RestaurantFilter
        value={filters.restaurantId}
        onChange={(restaurantId) => {
          onChange({ restaurantId })
        }}
      />
      <RefreshControl refresh={refresh} />
    </section>
  )
}
