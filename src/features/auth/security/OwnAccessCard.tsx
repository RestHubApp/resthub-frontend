import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ACCESS_PAGE_SIZE, ownAccessHistoryQuery } from '@/api/accessHistory'
import { AccessHistoryPanel } from '@/components/AccessHistoryPanel'
import { SectionCard } from '@/components/SectionCard'
import { describeAccess } from '@/services/accessHistory'
import { useTimeZone } from '@/store/session'

/**
 * «Mis accesos» (RFS-15): cada vez que alguien intentó entrar con esta
 * cuenta en los últimos 90 días. Un acceso que no reconoces es motivo para
 * cambiar la contraseña y cerrar las demás sesiones.
 */
export function OwnAccessCard() {
  const timeZone = useTimeZone()
  const [limit, setLimit] = useState(ACCESS_PAGE_SIZE)
  const history = useQuery({ ...ownAccessHistoryQuery(limit), placeholderData: keepPreviousData })
  const accesses = (history.data?.items ?? []).map((entry) => describeAccess(entry, timeZone))

  return (
    <SectionCard title="Mis accesos" description="Los intentos de entrar con tu cuenta en los últimos 90 días. Si no reconoces uno, cambia tu contraseña.">
      <AccessHistoryPanel label="Mis accesos" history={history} accesses={accesses} onMore={() => { setLimit(limit + ACCESS_PAGE_SIZE) }} />
    </SectionCard>
  )
}
