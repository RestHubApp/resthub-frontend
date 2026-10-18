import { useQuery } from '@tanstack/react-query'

import { closeOtherSessions, closeOwnSession, ownSessionsQuery, ownSessionsQueryKey } from '@/api/accountSecurity'
import { describeDeviceSession } from '@/services/deviceSessions'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'
import { useTimeZone } from '@/store/session'

/** Las sesiones abiertas de la cuenta propia y cómo cerrarlas: una o todas las demás. */
export function useOwnSessions() {
  const timeZone = useTimeZone()
  const sessions = useQuery(ownSessionsQuery)
  const closeOne = useNotifiedMutation({
    mutationFn: (sessionRef: string) => closeOwnSession(sessionRef),
    success: () => 'Sesión cerrada. Ese dispositivo tendrá que volver a entrar.',
    failure: 'No se pudo cerrar la sesión.',
    invalidate: [ownSessionsQueryKey],
  })
  const closeOthers = useNotifiedMutation({
    mutationFn: closeOtherSessions,
    success: () => 'Se cerraron las sesiones de los demás dispositivos.',
    failure: 'No se pudieron cerrar las sesiones.',
    invalidate: [ownSessionsQueryKey],
  })
  const lines = (sessions.data ?? []).map((session) => describeDeviceSession(session, timeZone))
  return { sessions, lines, closeOne, closeOthers }
}
