import { useMutation } from '@tanstack/react-query'

import { acceptTerms, fetchCurrentUser } from '@/api/auth'
import type { AcceptTermsRequest } from '@/api/types'
import { hasCode } from '@/services/apiError'
import { useSession } from '@/store/session'

/**
 * La mutación que acepta las versiones leídas de los términos y del tratamiento
 * de datos. Al aceptar actualiza la sesión; si alguna versión cambió mientras se
 * leía (`outdated_terms`), relee la cuenta.
 */
export function useAcceptTerms(versions: AcceptTermsRequest) {
  const refresh = useSession((state) => state.refresh)

  return useMutation({
    mutationFn: () => acceptTerms(versions),
    onSuccess: refresh,
    onError: async (error) => {
      if (hasCode(error, 'outdated_terms')) {
        refresh(await fetchCurrentUser())
      }
    },
  })
}
