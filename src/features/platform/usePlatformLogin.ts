import { useMutation } from '@tanstack/react-query'

import { PASSWORD_MUTATION_GC_TIME, platformLogin, platformMutationKeys } from '@/api/platform'
import type { PlatformAdmin } from '@/api/types'
import { useCredentialsForm } from '@/hooks/useCredentialsForm'

/** El formulario de ingreso de plataforma: campos, validación y la mutación de login. */
export function usePlatformLogin(onSignedIn: (token: string, admin: PlatformAdmin) => void) {
  const access = useMutation({
    mutationKey: platformMutationKeys.login,
    mutationFn: platformLogin,
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: ({ access_token: token, admin }) => {
      onSignedIn(token, admin)
    },
  })
  const { bind, errors, submit } = useCredentialsForm((credentials) => {
    access.mutate(credentials)
  })

  return { bind, errors, access, submit }
}
