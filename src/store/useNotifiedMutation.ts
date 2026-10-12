import { type QueryClient, type QueryKey, useMutation, useQueryClient } from '@tanstack/react-query'

import { errorMessage } from '@/services/apiError'
import { useNotifications } from './notifications'

interface NotifiedMutationOptions<TVariables, TResult> {
  readonly mutationFn: (variables: TVariables) => Promise<TResult>
  /** El aviso si sale bien. Sin él, el cambio se ve en la pantalla y basta. */
  readonly success?: (result: TResult) => string
  /**
   * El aviso si el servidor lo rechaza; el `detail` del servidor tiene prioridad.
   * Sin él no hay aviso: el formulario muestra el error junto a sus campos.
   */
  readonly failure?: string | undefined
  /** Pone la respuesta del servidor en la caché, sin esperar a releerla. */
  readonly updateCache?: (queryClient: QueryClient, result: TResult) => void
  /** Las consultas que se releen de fondo al terminar. */
  readonly invalidate?: readonly QueryKey[]
  /** Espera a que termine la relectura antes de avisar y de llamar a `onSuccess`. */
  readonly shouldWait?: boolean
  /** Lo que sigue al éxito, ya con el aviso puesto (cerrar la ventana, limpiar el campo). */
  readonly onSuccess?: (result: TResult) => void
  /** Las consultas que también se releen si falla (pudieron cambiar mientras tanto). */
  readonly invalidateOnError?: readonly QueryKey[]
}

/**
 * Una mutación que avisa: pone la respuesta en la caché, relee lo que cambió y
 * muestra el aviso de éxito o, si falla, lo que dijo el servidor.
 *
 * Es el esqueleto que repetían los hooks de pedidos, caja, carta, mesas, roles,
 * compras y reservas; cada uno solo dice qué cambia en la caché y qué relee.
 */
export function useNotifiedMutation<TVariables = void, TResult = unknown>({
  mutationFn,
  success,
  failure,
  updateCache,
  invalidate = [],
  shouldWait = false,
  onSuccess,
  invalidateOnError = [],
}: NotifiedMutationOptions<TVariables, TResult>) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const reread = (keys: readonly QueryKey[]) => keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      updateCache?.(queryClient, result)
      const pending = Promise.all(reread(invalidate))
      const finish = () => {
        if (success !== undefined) {
          push({ tone: 'info', message: success(result) })
        }
        onSuccess?.(result)
      }
      if (shouldWait) {
        return pending.then(finish)
      }
      // Sin espera, el aviso sale en el acto; la relectura sigue de fondo.
      finish()
      return undefined
    },
    onError: (error) => {
      void Promise.all(reread(invalidateOnError))
      if (failure !== undefined) {
        push({ tone: 'warning', message: errorMessage(error, failure) })
      }
    },
  })
}
