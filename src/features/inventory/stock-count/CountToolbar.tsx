import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { SegmentedChoice } from '@/components/SegmentedChoice'
import { Input } from '@/components/ui/input'
import { COUNT_FILTERS, type CountFilter } from './countFilter'

interface CountToolbarProps {
  readonly search: string
  readonly onSearch: (search: string) => void
  readonly filter: CountFilter
  readonly onFilter: (filter: CountFilter) => void
  readonly counted: number
  readonly total: number
}

/** El avance del conteo, el buscador y qué líneas se ven. */
export function CountToolbar({ search, onSearch, filter, onFilter, counted, total }: CountToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-sm" aria-live="polite">
        <strong>{counted}</strong> de <strong>{total}</strong> insumos contados
      </p>
      <div aria-hidden className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${String(total === 0 ? 0 : (counted / total) * 100)}%` }} />
      </div>
      <div className="relative">
        <Icon glyph={icons.search} size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar insumo"
          placeholder="Buscar insumo"
          className="pl-9"
          value={search}
          onChange={(event) => {
            onSearch(event.target.value)
          }}
        />
      </div>
      <SegmentedChoice legend="Qué insumos ver" name="filtro-conteo" layout="fill" options={COUNT_FILTERS} value={filter} onChange={onFilter} />
    </div>
  )
}
