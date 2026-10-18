import { useQuery } from '@tanstack/react-query'

import { UNUSED_DAYS, unusedStaffQuery } from '@/api/accountSecurity'
import { SectionCard } from '@/components/SectionCard'
import { UnusedStaffRow } from './UnusedStaffRow'

/**
 * La revisión de accesos (RFS-24): las cuentas activas que nadie usa hace
 * tiempo. Una cuenta olvidada es una puerta abierta; si la persona ya no
 * trabaja en el local, se desactiva. Sin cuentas así, la tarjeta no aparece.
 */
export function UnusedStaffCard() {
  const unused = useQuery(unusedStaffQuery)
  const entries = unused.data ?? []
  if (entries.length === 0) return null

  return (
    <SectionCard
      title="Cuentas sin uso"
      description={`Cuentas activas que no se usan hace ${String(UNUSED_DAYS)} días o más. Si la persona ya no trabaja aquí, desactiva su cuenta.`}
    >
      <ul aria-label="Cuentas sin uso" className="m-0 flex list-none flex-col divide-y divide-border p-0">
        {entries.map((entry) => <UnusedStaffRow key={entry.member.id} entry={entry} />)}
      </ul>
    </SectionCard>
  )
}
