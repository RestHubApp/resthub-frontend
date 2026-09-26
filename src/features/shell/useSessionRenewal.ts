import { renewSession } from '../../api/auth'
import { useTokenRenewal } from '../../hooks/useTokenRenewal'
import { useSession } from '../../store/session'

/**
 * Renueva el token del restaurante antes de que venza mientras la aplicación
 * se esté usando.
 *
 * El token dura una hora: sin esto, el mesero tendría que volver a entrar a
 * mitad del turno.
 */
export function useSessionRenewal(): void {
  const token = useSession((state) => state.token)
  const renew = useSession((state) => state.renew)

  useTokenRenewal(token, async (origen) => {
    const nuevo = await renewSession()
    renew(origen, nuevo.access_token, { user: nuevo.user, restaurant: nuevo.restaurant, permissions: nuevo.permissions })
  })
}
