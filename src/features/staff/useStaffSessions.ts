import { useQuery } from '@tanstack/react-query'

import { closeStaffSession, closeStaffSessions, staffSessionsQuery, staffSessionsQueryKey } from '@/api/accountSecurity'
import type { StaffResponse } from '@/api/types'
import { describeDeviceSession } from '@/services/deviceSessions'
import { useTimeZone } from '@/store/session'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

/** Las sesiones abiertas de una cuenta del personal y cómo cerrarlas (RFS-17). */
export function useStaffSessions(account: StaffResponse, isOpen: boolean) {
  const timeZone = useTimeZone()
  const sessions = useQuery({ ...staffSessionsQuery(account.id), enabled: isOpen })
  const invalidate = [staffSessionsQueryKey(account.id)]
  const closeOne = useNotifiedMutation({
    mutationFn: (sessionRef: string) => closeStaffSession(account.id, sessionRef),
    success: () => `Sesión de ${account.full_name} cerrada.`,
    failure: 'No se pudo cerrar la sesión.',
    invalidate,
  })
  const closeAll = useNotifiedMutation({
    mutationFn: () => closeStaffSessions(account.id),
    success: () => `Se cerraron todas las sesiones de ${account.full_name}.`,
    failure: 'No se pudieron cerrar las sesiones.',
    invalidate,
  })
  const lines = (sessions.data ?? []).map((session) => describeDeviceSession(session, timeZone))
  return { sessions, lines, closeOne, closeAll }
}
