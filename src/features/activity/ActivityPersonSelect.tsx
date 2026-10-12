import { useQuery } from '@tanstack/react-query'

import { MAX_STAFF_PAGE, staffQuery } from '@/api/staff'
import { FilterSelect } from '@/components/FilterSelect'

interface ActivityPersonSelectProps {
  readonly person: number | null
  readonly onChange: (person: number | null) => void
}

/** «Persona»: las cuentas del personal del restaurante (la misma lista, y la misma consulta, que Personal); vacío es todas. */
export function ActivityPersonSelect({ person, onChange }: ActivityPersonSelectProps) {
  const staff = useQuery(staffQuery({ limit: MAX_STAFF_PAGE, ordering: 'full_name' }))
  const options = (staff.data?.items ?? []).map((account) => ({ value: String(account.id), label: account.full_name }))

  return (
    <FilterSelect
      label="Persona"
      value={person === null ? '' : String(person)}
      options={options}
      allLabel="Todo el personal"
      className="sm:max-w-xs"
      onChange={(value) => {
        onChange(value === '' ? null : Number(value))
      }}
    />
  )
}
