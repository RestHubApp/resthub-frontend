import FilterActions from './FilterActions'
import FilterSelect from './FilterSelect'
import FilterTextField from './FilterTextField'
import { MAX_REQUEST_ID, MAX_ROUTE, type ObsFilters, STATUS_MIN_OPTIONS } from './obsFilters'
import { useDraft } from './useDraft'

interface RequestFiltersProps {
  readonly filters: ObsFilters
  readonly onChange: (patch: Partial<ObsFilters>) => void
}

const ESTADOS = STATUS_MIN_OPTIONS.map((option) => ({
  value: option.value === null ? '' : String(option.value),
  label: option.label,
}))

// Un estado que llegó por la dirección y no está en la lista se ofrece igual.
function estados(statusMin: number | null) {
  if (statusMin === null || ESTADOS.some((option) => option.value === String(statusMin))) {
    return ESTADOS
  }
  return [...ESTADOS, { value: String(statusMin), label: `Desde ${String(statusMin)}` }]
}

/** Desde qué estado, qué ruta (su plantilla exacta) y qué `request_id`. */
export default function RequestFilters({ filters, onChange }: RequestFiltersProps) {
  const [ruta, setRuta] = useDraft(filters.route)
  const [peticion, setPeticion] = useDraft(filters.requestId)
  const activos = filters.statusMin !== null || filters.route !== '' || filters.requestId !== ''
  return (
    <form
      role="search"
      aria-label="Filtrar peticiones"
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        onChange({
          route: ruta.trim(),
          requestId: peticion.trim(),
        })
      }}
    >
      <FilterSelect
        id="peticiones-estado"
        label="Estado"
        value={filters.statusMin === null ? '' : String(filters.statusMin)}
        options={estados(filters.statusMin)}
        onChange={(value) => {
          onChange({ statusMin: value === '' ? null : Number(value) })
        }}
      />
      <FilterTextField
        id="peticiones-ruta"
        name="ruta"
        label="Ruta (plantilla)"
        placeholder="/api/v1/orders/{order_id}"
        value={ruta}
        onChange={setRuta}
        maxLength={MAX_ROUTE}
      />
      <FilterTextField
        id="peticiones-id"
        name="peticion"
        label="request_id"
        value={peticion}
        onChange={setPeticion}
        maxLength={MAX_REQUEST_ID}
      />
      <FilterActions
        active={activos}
        onClear={() => {
          onChange({ statusMin: null, route: '', requestId: '' })
        }}
      />
    </form>
  )
}
