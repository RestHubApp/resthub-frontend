import { useMutation, useQueryClient } from '@tanstack/react-query'

import { unlockOwnSession } from '@/api/accountSecurity'
import type { UnlockRequest } from '@/api/types'
import { useSession } from '@/store/session'

/**
 * Desbloquea la sesión con el PIN o la contraseña y relee lo que se muestra:
 * mientras estuvo bloqueada, el salón y los pedidos siguieron cambiando.
 *
 * El tercer intento equivocado cierra la sesión: el servidor responde 401 y el
 * cliente HTTP la cierra solo.
 */
export function useUnlock() {
  const queryClient = useQueryClient()
  const setLocked = useSession((state) => state.setLocked)
  return useMutation({
    mutationFn: (payload: UnlockRequest) => unlockOwnSession(payload),
    onSuccess: () => {
      setLocked(false)
      void queryClient.invalidateQueries()
    },
  })
}
