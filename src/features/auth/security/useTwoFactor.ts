import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { beginTwoFactor, confirmTwoFactor, disableTwoFactor, renewRecoveryCodes, twoFactorQuery, twoFactorQueryKey } from '@/api/twoFactor'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

/** El estado de la verificación en dos pasos y lo que se hace con ella (RFS-22). */
export function useTwoFactor() {
  const queryClient = useQueryClient()
  const reread = () => queryClient.invalidateQueries({ queryKey: twoFactorQueryKey })
  const status = useQuery(twoFactorQuery)
  // El alta deja la verificación pendiente de confirmar: el estado se relee.
  const begin = useMutation({ mutationFn: beginTwoFactor, onSuccess: reread })
  const confirm = useMutation({ mutationFn: (code: string) => confirmTwoFactor(code), onSuccess: reread })
  const renew = useMutation({ mutationFn: renewRecoveryCodes, onSuccess: reread })
  const disable = useNotifiedMutation({
    mutationFn: disableTwoFactor,
    success: () => 'Verificación en dos pasos desactivada: para entrar basta tu contraseña.',
    failure: 'No se pudo desactivar la verificación en dos pasos.',
    invalidate: [twoFactorQueryKey],
  })
  return { status, begin, confirm, renew, disable }
}
