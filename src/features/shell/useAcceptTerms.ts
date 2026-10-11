import { useMutation } from '@tanstack/react-query'

import { acceptTerms, fetchCurrentUser } from '@/api/auth'
import { errorStatus } from '@/services/api'
import { useSession } from '@/store/session'

// La versión cambió mientras se leía: se relee la sesión y se pide la nueva.
const VERSION_CHANGED = 409

/**
 * La mutación que acepta la versión de los términos. Al aceptar actualiza la
 * sesión; si la versión cambió mientras se leía (409), relee la cuenta.
 */
export function useAcceptTerms(termsVersion: string) {
  const refresh = useSession((state) => state.refresh)

  return useMutation({
    mutationFn: () => acceptTerms(termsVersion),
    onSuccess: refresh,
    onError: async (error) => {
      if (errorStatus(error) === VERSION_CHANGED) {
        refresh(await fetchCurrentUser())
      }
    },
  })
}
