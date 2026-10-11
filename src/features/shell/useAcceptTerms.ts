import { useMutation } from '@tanstack/react-query'

import { acceptTerms, fetchCurrentUser } from '@/api/auth'
import { hasCode } from '@/services/apiError'
import { useSession } from '@/store/session'

/**
 * La mutación que acepta la versión de los términos. Al aceptar actualiza la
 * sesión; si la versión cambió mientras se leía (`outdated_terms`), relee la cuenta.
 */
export function useAcceptTerms(termsVersion: string) {
  const refresh = useSession((state) => state.refresh)

  return useMutation({
    mutationFn: () => acceptTerms(termsVersion),
    onSuccess: refresh,
    onError: async (error) => {
      if (hasCode(error, 'outdated_terms')) {
        refresh(await fetchCurrentUser())
      }
    },
  })
}
