import { Icon } from './Icon'
import { StatusBadge } from './StatusBadge'
import { Button } from './ui/button'

/** Una sesión abierta ya descrita (`describeDeviceSession`). */
interface SessionLine {
  readonly id: string
  readonly device: string
  readonly detail: string
  readonly isCurrent: boolean
}

interface DeviceSessionListProps {
  /** El nombre de la lista para el lector de pantalla. */
  readonly label: string
  readonly sessions: readonly SessionLine[]
  /** Cierra una sesión. La de este dispositivo no se cierra desde aquí: para eso está «Cerrar sesión». */
  readonly onClose: (session: SessionLine) => void
  /** La sesión que se está cerrando: su botón espera. */
  readonly closingId?: string | null | undefined
}

/** Las sesiones abiertas de una cuenta, una por dispositivo, con su botón para cerrarla. */
export function DeviceSessionList({ label, sessions, onClose, closingId = null }: DeviceSessionListProps) {
  return (
    <ul aria-label={label} className="m-0 flex list-none flex-col divide-y divide-border p-0">
      {sessions.map((session) => (
        <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="m-0 flex flex-wrap items-center gap-2 font-medium break-words">
              <span>{session.device}</span>
              {session.isCurrent ? <StatusBadge label="Este dispositivo" tone="confirmed" /> : null}
            </p>
            <p className="m-0 text-sm break-words text-muted-foreground">{session.detail}</p>
          </div>
          {session.isCurrent ? null : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={closingId === session.id}
              aria-label={`Cerrar la sesión de ${session.device}`}
              onClick={() => {
                onClose(session)
              }}
            >
              <Icon name="signOut" size={14} />
              <span>{closingId === session.id ? 'Cerrando…' : 'Cerrar'}</span>
            </Button>
          )}
        </li>
      ))}
    </ul>
  )
}
