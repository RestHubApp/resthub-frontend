import { Navigate } from 'react-router'

import { useSession } from '../../store/session'
import { entriesFor } from './navigation'

/**
 * La raiz no tiene pantalla propia: lleva a donde trabaja cada cuenta.
 *
 * El mesero cae en Pedidos y el encargado en la primera entrada de su menu.
 * Una cuenta sin ninguna pantalla todavia puede ver su perfil.
 */
export default function HomeRedirect() {
  const account = useSession((state) => state.account)

  if (account === null) {
    return <Navigate to="/acceso" replace />
  }
  const primera = entriesFor(account.permissions).at(0)
  return <Navigate to={primera?.to ?? '/perfil'} replace />
}
