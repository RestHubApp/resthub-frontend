import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DeviceSessionList } from '@/components/DeviceSessionList'
import { ListSkeleton } from '@/components/ListSkeleton'
import { RetryQueryError } from '@/components/RetryQueryError'
import { SectionCard } from '@/components/SectionCard'
import { Button } from '@/components/ui/button'
import { useOwnSessions } from './useOwnSessions'

/**
 * Las sesiones abiertas de la cuenta propia, una por dispositivo (RFS-17).
 *
 * Si alguien perdió el celular o entró desde una computadora prestada, cierra
 * esa sesión desde aquí sin tocar la de este dispositivo.
 */
export function OwnSessionsCard() {
  const { sessions, lines, closeOne, closeOthers } = useOwnSessions()
  const hasOthers = lines.some((line) => !line.isCurrent)
  const closeAll = (
    <ConfirmDialog
      trigger={<Button type="button" size="sm" variant="outline" disabled={closeOthers.isPending}>Cerrar las demás</Button>}
      title="¿Cerrar las sesiones de los demás dispositivos?"
      description="Quedará abierta solo la de este dispositivo. En los demás habrá que volver a entrar con la contraseña."
      confirmLabel="Cerrar las demás"
      onConfirm={() => { closeOthers.mutate() }}
    />
  )

  return (
    <SectionCard
      title="Sesiones abiertas"
      description="Los dispositivos donde tu cuenta está abierta. Si no reconoces uno, ciérralo y cambia tu contraseña."
      actions={hasOthers ? closeAll : undefined}
    >
      {sessions.isPending ? <ListSkeleton label="Cargando las sesiones…" count={2} /> : null}
      {sessions.isError ? (
        <RetryQueryError error={sessions.error} fallback="No se pudieron cargar las sesiones." onRetry={() => { void sessions.refetch() }} />
      ) : null}
      {sessions.isSuccess ? (
        <DeviceSessionList
          label="Sesiones abiertas"
          sessions={lines}
          closingId={closeOne.isPending ? closeOne.variables : null}
          onClose={(line) => { closeOne.mutate(line.id) }}
        />
      ) : null}
    </SectionCard>
  )
}
