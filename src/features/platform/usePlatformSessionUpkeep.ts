import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { platformMeQuery, renewPlatformSession } from '../../api/platform'
import { useTokenRenewal } from '../../hooks/useTokenRenewal'
import { usePlatformSession } from '../../store/platformSession'

const REFRESH_MS = 5 * 60_000

/**
 * Mantiene viva y al día la sesión de plataforma mientras el área está abierta.
 *
 * Renueva el token antes de que venza, como la sesión del restaurante, y
 * relee `GET /platform/auth/me` cada tanto: si la cuenta se desactivó, el 401
 * cierra la sesión desde el cliente HTTP y la guarda lleva al acceso.
 */
export function usePlatformSessionUpkeep(): void {
  const token = usePlatformSession((state) => state.token)
  const renew = usePlatformSession((state) => state.renew)
  const refresh = usePlatformSession((state) => state.refresh)

  useTokenRenewal(token, async () => {
    const nuevo = await renewPlatformSession()
    renew(nuevo.access_token, nuevo.admin)
  })

  const yo = useQuery({ ...platformMeQuery, enabled: token !== null, staleTime: REFRESH_MS, refetchInterval: REFRESH_MS })
  useEffect(() => {
    if (yo.data !== undefined) {
      refresh(yo.data.admin)
    }
  }, [yo.data, refresh])
}
