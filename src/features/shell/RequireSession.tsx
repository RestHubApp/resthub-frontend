import { Navigate, Outlet, useLocation } from 'react-router'

import type { PermissionCode } from '../../api/types'
import { hasPermission, useSession } from '../../store/session'

interface RequireSessionProps {
  /** Permiso que exige la ruta. Sin el, basta con estar autenticado. */
  readonly permission?: PermissionCode
}

/**
 * Guarda de rutas.
 *
 * Es una comodidad de la interfaz, no una medida de seguridad: quien llegue
 * igual a la pantalla se encuentra con que el API le responde 401 o 403. La
 * autorizacion de verdad vive en el servidor. Sin el permiso, la guarda lleva
 * al inicio, que elige la primera pantalla que la cuenta si puede abrir.
 */
export default function RequireSession({ permission }: RequireSessionProps) {
  const account = useSession((state) => state.account)
  const location = useLocation()

  if (account === null) {
    return <Navigate to="/acceso" replace state={{ from: location.pathname }} />
  }
  if (permission !== undefined && !hasPermission(account, permission)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
