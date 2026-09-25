import { useQuery } from '@tanstack/react-query'

import { fetchStaff, MAX_STAFF_PAGE, staffListQueryKey } from '../../../api/staff'
import { NativeSelectOption } from '../../../components/ui/native-select'
import { useCan } from '../../../store/session'
import { STATUS_OPTIONS, TYPE_OPTIONS } from '../orderLabels'
import DateFilter from './DateFilter'
import FilterSelect from './FilterSelect'
import type { HistoryFilters } from './historyFilters'

interface HistoryFiltersBarProps {
  readonly value: HistoryFilters
  readonly onChange: (value: HistoryFilters) => void
}

const PERSONAL = { limit: MAX_STAFF_PAGE, ordering: 'full_name' } as const

/**
 * Fechas, estado, tipo y mesero.
 *
 * La lista de meseros sale del personal, que solo lee quien lo administra. Sin
 * ese permiso el filtro no aparece, en vez de mostrarse vacio.
 */
export default function HistoryFiltersBar({ value, onChange }: HistoryFiltersBarProps) {
  const verPersonal = useCan('staff.manage')
  const personal = useQuery({
    queryKey: staffListQueryKey(PERSONAL),
    queryFn: () => fetchStaff(PERSONAL),
    enabled: verPersonal,
  })
  const cambiar = (parcial: Partial<HistoryFilters>) => {
    onChange({ ...value, ...parcial })
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <DateFilter id="historial-desde" label="Desde" value={value.from} onChange={(from) => {
        cambiar({ from })
      }} />
      <DateFilter id="historial-hasta" label="Hasta" value={value.to} onChange={(to) => {
        cambiar({ to })
      }} />
      <FilterSelect id="historial-estado" label="Estado" anyLabel="Cualquiera" value={value.status} onChange={(status) => {
        cambiar({ status: STATUS_OPTIONS.find((opcion) => opcion.value === status)?.value ?? '' })
      }}>
        {STATUS_OPTIONS.map((opcion) => (
          <NativeSelectOption key={opcion.value} value={opcion.value}>{opcion.label}</NativeSelectOption>
        ))}
      </FilterSelect>
      <FilterSelect id="historial-tipo" label="Tipo" anyLabel="En mesa y para llevar" value={value.type} onChange={(type) => {
        cambiar({ type: TYPE_OPTIONS.find((opcion) => opcion.value === type)?.value ?? '' })
      }}>
        {TYPE_OPTIONS.map((opcion) => (
          <NativeSelectOption key={opcion.value} value={opcion.value}>{opcion.label}</NativeSelectOption>
        ))}
      </FilterSelect>
      {verPersonal ? (
        <FilterSelect id="historial-mesero" label="Mesero" anyLabel="Cualquiera" value={value.waiterId} onChange={(waiterId) => {
          cambiar({ waiterId })
        }}>
          {(personal.data?.items ?? []).map((cuenta) => (
            <NativeSelectOption key={cuenta.id} value={String(cuenta.id)}>{cuenta.full_name}</NativeSelectOption>
          ))}
        </FilterSelect>
      ) : null}
    </div>
  )
}
