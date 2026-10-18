import type { StaffResponse } from '@/api/types'
import { DeviceSessionList } from '@/components/DeviceSessionList'
import { EmptyState } from '@/components/EmptyState'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import type { useStaffSessions } from './useStaffSessions'

interface StaffSessionsBodyProps {
  readonly account: StaffResponse
  readonly model: ReturnType<typeof useStaffSessions>
}

/** La lista de sesiones de una cuenta, con su carga, su error y su vacío. */
export function StaffSessionsBody({ account, model }: StaffSessionsBodyProps) {
  const { sessions, lines, closeOne } = model
  return (
    <>
      {sessions.isPending ? <ListSkeleton label="Cargando las sesiones…" count={2} /> : null}
      {sessions.isError ? (
        <RetryQueryError error={sessions.error} fallback="No se pudieron cargar las sesiones." onRetry={() => { void sessions.refetch() }} />
      ) : null}
      {sessions.isSuccess && lines.length === 0 ? <EmptyState title="Sin sesiones abiertas" description="Ahora no tiene la sesión abierta en ningún dispositivo." /> : null}
      {lines.length > 0 ? (
        <DeviceSessionList
          label={`Sesiones de ${account.full_name}`}
          sessions={lines}
          closingId={closeOne.isPending ? closeOne.variables : null}
          onClose={(line) => { closeOne.mutate(line.id) }}
        />
      ) : null}
    </>
  )
}
