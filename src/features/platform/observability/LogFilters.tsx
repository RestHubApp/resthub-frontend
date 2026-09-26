import type { ObsLogLevel } from '../../../api/types'
import FilterActions from './FilterActions'
import FilterSelect from './FilterSelect'
import FilterTextField from './FilterTextField'
import { MAX_LOG_SEARCH, MAX_REQUEST_ID, type ObsFilters } from './obsFilters'
import { useDraft } from './useDraft'

interface LogFiltersProps {
  readonly filters: ObsFilters
  readonly onChange: (patch: Partial<ObsFilters>) => void
}

const NIVELES = [
  { value: '', label: 'Todos' },
  { value: 'warning', label: 'Advertencias' },
  { value: 'error', label: 'Errores' },
]

/** Nivel, búsqueda en el evento y sus campos, y `request_id`. */
export default function LogFilters({ filters, onChange }: LogFiltersProps) {
  const [busqueda, setBusqueda] = useDraft(filters.logSearch)
  const [peticion, setPeticion] = useDraft(filters.logRequestId)
  const activos = filters.logLevel !== null || filters.logSearch !== '' || filters.logRequestId !== ''
  return (
    <form
      role="search"
      aria-label="Filtrar logs"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onChange({
          logSearch: busqueda.trim(),
          logRequestId: peticion.trim(),
        })
      }}
    >
      <FilterSelect
        id="logs-nivel"
        label="Nivel"
        value={filters.logLevel ?? ''}
        options={NIVELES}
        onChange={(value) => {
          onChange({ logLevel: value === '' ? null : (value as ObsLogLevel) })
        }}
      />
      <FilterTextField
        id="logs-buscar"
        name="buscar"
        type="search"
        label="Buscar en el evento y sus campos"
        value={busqueda}
        onChange={setBusqueda}
        maxLength={MAX_LOG_SEARCH}
      />
      <FilterTextField
        id="logs-peticion"
        name="peticion"
        label="request_id"
        value={peticion}
        onChange={setPeticion}
        maxLength={MAX_REQUEST_ID}
      />
      <FilterActions
        active={activos}
        onClear={() => {
          onChange({ logLevel: null, logSearch: '', logRequestId: '' })
        }}
      />
    </form>
  )
}
