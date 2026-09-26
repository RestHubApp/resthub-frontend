import { Navigate, Outlet, useLocation } from 'react-router'

import { usePlatformSession } from '../../store/platformSession'

/**
 * Guarda del área de plataforma.
 *
 * Mira solo la sesión de plataforma: una sesión de restaurante abierta no
 * entra acá. Es comodidad de la interfaz; el servidor rechaza con 401
 * cualquier token que no sea de plataforma.
 */
export default function RequirePlatformSession() {
  const admin = usePlatformSession((state) => state.admin)
  const location = useLocation()

  if (admin === null) {
    return <Navigate to="/plataforma/acceso" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
