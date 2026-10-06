import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'

import { currentUserQueryKey, fetchCurrentUser } from '../../api/auth'
import { useSession } from '../../store/session'

// El nombre del restaurante o los permisos cambian muy de vez en cuando: basta
// con leerlos al abrir la aplicacion y cada tanto mientras sigue abierta.
const REFRESH_MS = 5 * 60_000

/**
 * Mantiene al dia la cuenta guardada con `GET /auth/me`.
 *
 * La sesion se guarda en el navegador para no pedir la contraseña en cada
 * recarga, asi que sin esto un cambio de rol o del nombre del restaurante no
 * se veria hasta volver a entrar. Si el token ya no vale, el 401 cierra la
 * sesion desde el cliente HTTP.
 */
export function useAccountRefresh(): void {
  const token = useSession((state) => state.token)
  const refresh = useSession((state) => state.refresh)

  const cuenta = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: () => fetchCurrentUser({ background: true }),
    enabled: token !== null,
    staleTime: REFRESH_MS,
    refetchInterval: REFRESH_MS,
    // Es de fondo: si falla, la cuenta guardada sigue sirviendo y se vuelve a
    // pedir sola. No muestra el aviso del armazón (ver useFailedQueries), que
    // obligaba a reintentar dos veces tras un corte: una por la pantalla y
    // otra por esta lectura.
    meta: { background: true },
  })

  useEffect(() => {
    if (cuenta.data !== undefined) {
      refresh(cuenta.data)
    }
  }, [cuenta.data, refresh])
}
