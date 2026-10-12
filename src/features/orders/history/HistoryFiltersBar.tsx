import { useQuery } from '@tanstack/react-query'

import { PERMISSION } from '@/api/permissions'
import { MAX_STAFF_PAGE, staffQuery } from '@/api/staff'
import { useCan } from '@/store/session'
import { STATUS_OPTIONS, TYPE_OPTIONS } from '@/features/orders/orderLabels'
import { DateFilter } from './DateFilter'
import { FilterSelect } from '@/components/FilterSelect'
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
      <FilterSelect
        id="historial-estado"
        label="Estado"
        allLabel="Cualquiera"
        value={value.status}
        options={STATUS_OPTIONS}
        onChange={(status) => {
          change({ status })
        }}
      />
      <FilterSelect
        id="historial-tipo"
        label="Tipo"
        allLabel="En mesa y para llevar"
        className="col-span-2 md:col-span-1"
        value={value.type}
        options={TYPE_OPTIONS}
        onChange={(type) => {
          change({ type })
        }}
      />
      {canViewStaff ? (
        <FilterSelect
          id="historial-mesero"
          label="Mesero"
          allLabel="Cualquiera"
          value={value.waiterId}
          options={(staff.data?.items ?? []).map((account) => ({ value: String(account.id), label: account.full_name }))}
          onChange={(waiterId) => {
            change({ waiterId })
          }}
        />
      ) : null}
    </div>
  )
}
