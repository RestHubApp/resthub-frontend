import { useQuery } from '@tanstack/react-query'

import { PERMISSION } from '@/api/permissions'
import { MAX_STAFF_PAGE, staffQuery } from '@/api/staff'
import { NativeSelectOption } from '@/components/ui/native-select'
import { useCan } from '@/store/session'
import { STATUS_OPTIONS, TYPE_OPTIONS } from '@/features/orders/orderLabels'
import { DateFilter } from './DateFilter'
import { FilterSelect } from './FilterSelect'
import type { HistoryFilters } from './historyFilters'

interface HistoryFiltersBarProps {
  readonly value: HistoryFilters
  readonly onChange: (value: HistoryFilters) => void
}

const STAFF = { limit: MAX_STAFF_PAGE, ordering: 'full_name' } as const

/**
 * Fechas, estado, tipo y mesero.
 *
 * La lista de meseros sale del personal, que solo lee quien lo administra. Sin
 * ese permiso el filtro no aparece, en vez de mostrarse vacio.
 */
export function HistoryFiltersBar({ value, onChange }: HistoryFiltersBarProps) {
  const canViewStaff = useCan(PERMISSION.staffManage)
  const staff = useQuery({ ...staffQuery(STAFF), enabled: canViewStaff })
  const change = (partial: Partial<HistoryFilters>) => {
    onChange({ ...value, ...partial })
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <DateFilter id="historial-desde" label="Desde" value={value.from} onChange={(from) => {
        change({ from })
      }} />
      <DateFilter id="historial-hasta" label="Hasta" value={value.to} onChange={(to) => {
        change({ to })
      }} />
      <FilterSelect id="historial-estado" label="Estado" anyLabel="Cualquiera" value={value.status} onChange={(status) => {
        change({ status: STATUS_OPTIONS.find((option) => option.value === status)?.value ?? '' })
      }}>
        {STATUS_OPTIONS.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>
        ))}
      </FilterSelect>
      <FilterSelect id="historial-tipo" label="Tipo" anyLabel="En mesa y para llevar" className="col-span-2 md:col-span-1" value={value.type} onChange={(type) => {
        change({ type: TYPE_OPTIONS.find((option) => option.value === type)?.value ?? '' })
      }}>
        {TYPE_OPTIONS.map((option) => (
          <NativeSelectOption key={option.value} value={option.value}>{option.label}</NativeSelectOption>
        ))}
      </FilterSelect>
      {canViewStaff ? (
        <FilterSelect id="historial-mesero" label="Mesero" anyLabel="Cualquiera" value={value.waiterId} onChange={(waiterId) => {
          change({ waiterId })
        }}>
          {(staff.data?.items ?? []).map((account) => (
            <NativeSelectOption key={account.id} value={String(account.id)}>{account.full_name}</NativeSelectOption>
          ))}
        </FilterSelect>
      ) : null}
    </div>
  )
}
