import { useMutation, useQueryClient } from '@tanstack/react-query'

import { PASSWORD_MUTATION_GC_TIME, platformMutationKeys, resetPlatformOwnerPassword } from '@/api/platform'
import type { PlatformOwner } from '@/api/types'
import { saveOwner } from './restaurantCache'

interface ResetOwnerPasswordOptions {
  readonly restaurantId: number
  readonly owner: PlatformOwner
  readonly onDone: () => void
}

/** Pone la contraseña temporal del encargado y guarda en el caché lo que devolvió el servidor. */
export function useResetOwnerPassword({ restaurantId, owner, onDone }: ResetOwnerPasswordOptions) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: platformMutationKeys.resetOwnerPassword,
    mutationFn: (newPassword: string) => resetPlatformOwnerPassword(restaurantId, owner.id, newPassword),
    gcTime: PASSWORD_MUTATION_GC_TIME,
    onSuccess: (updated) => {
      saveOwner(queryClient, restaurantId, updated)
      onDone()
    },
  })
}
