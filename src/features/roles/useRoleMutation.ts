import { useMutation, useQueryClient } from '@tanstack/react-query'

import { currentUserQueryKey } from '../../api/auth'
import { rolesQuery, rolesQueryKey } from '../../api/roles'
import { staffQueryKey } from '../../api/staff'
import type { Role } from '../../api/types'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'
import { useSession } from '../../store/session'

interface RoleMutationOptions<TVariables, TResult> {
  readonly mutationFn: (variables: TVariables) => Promise<TResult>
  /** El rol que cambia: si es el de quien mira, su menú cambia con él. */
  readonly roleId?: number
  readonly failure: string
  readonly success: (result: TResult) => string
  /** Cómo quedan los roles con la respuesta del servidor, sin esperar a releerlos. */
  readonly updateCache: (roles: readonly Role[], result: TResult) => Role[]
  readonly onSuccess?: () => void
  /** El formulario muestra el error junto a sus campos: no hace falta el aviso. */
  readonly inlineError?: boolean
}

/**
 * Un cambio en los roles.
 *
 * Pone la respuesta del servidor en la lista y relee de fondo los roles y el
 * personal, que muestra el nombre de cada rol. Si el rol es el de quien mira,
 * relee también `GET /auth/me`: el menú y las pantallas siguen a los permisos
 * nuevos sin esperar el aviso del servidor. Un rechazo (403, 409) se muestra
 * con lo que dijo el servidor y relee los roles, que pudieron cambiar.
 */
export function useRoleMutation<TVariables, TResult>({
  mutationFn,
  roleId,
  failure,
  success,
  updateCache,
  onSuccess,
  inlineError = false,
}: RoleMutationOptions<TVariables, TResult>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const propioId = useSession((state) => state.account?.user.role_id)

  return useMutation({
    mutationFn,
    onSuccess: (resultado) => {
      queryClient.setQueryData(rolesQuery().queryKey, (roles) => roles && updateCache(roles, resultado))
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      void queryClient.invalidateQueries({ queryKey: staffQueryKey })
      if (roleId !== undefined && roleId === propioId) {
        void queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
      }
      push({ tone: 'info', message: success(resultado) })
      onSuccess?.()
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      if (!inlineError) {
        push({ tone: 'warning', message: errorMessage(error, failure) })
      }
    },
  })
}
