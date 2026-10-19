import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { renewSession, sessionOf, sessionRestoreQuery } from '@/api/auth'
import { useTokenRenewal } from '@/hooks/useTokenRenewal'
import { usePreview, useSession } from '@/store/session'

/**
 * Recupera de la cookie del API el token de esta pestaña cuando no lo tiene:
 * recién recargada la página (el token ya no se guarda en el navegador) o
 * después de soltar uno que el servidor cortó. Sin red lo vuelve a intentar;
 * un 401 (sin cookie, o vencida) cierra la sesión desde el cliente HTTP.
 */
function useSessionRestore(isPreview: boolean): void {
  const isMissing = useSession((state) => state.account !== null && state.token === null)
  const renew = useSession((state) => state.renew)

  const restored = useQuery({ ...sessionRestoreQuery, enabled: isMissing && !isPreview })

  useEffect(() => {
    if (restored.data !== undefined) {
      renew(null, restored.data.access_token, sessionOf(restored.data))
    }
  }, [restored.data, renew])
}

/**
 * Renueva el token del restaurante antes de que venza mientras la aplicación
 * se esté usando, y lo recupera de la cookie cuando falta.
 *
 * El token dura una hora: sin esto, el mesero tendría que volver a entrar a
 * mitad del turno. Una vista previa no se renueva (el servidor responde 401):
 * vence a la media hora y se abre otra desde la administración.
 */
export function useSessionRenewal(): void {
  const token = useSession((state) => state.token)
  const renew = useSession((state) => state.renew)
  const isPreview = usePreview()

  useTokenRenewal(isPreview ? null : token, async (origin) => {
    const fresh = await renewSession()
    renew(origin, fresh.access_token, sessionOf(fresh))
  })
  useSessionRestore(isPreview)
}
