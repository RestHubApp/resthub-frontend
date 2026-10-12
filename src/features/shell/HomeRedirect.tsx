import { Navigate } from 'react-router'

import { paths } from '@/services/paths'
import { useSession } from '@/store/session'
import { entriesFor } from './navigation'
import { useShellScreens } from './shellScreens'

/**
 * La raiz no tiene pantalla propia: lleva a donde trabaja cada cuenta.
 *
 * El mesero cae en Pedidos y el encargado en la primera entrada de su menu.
 * Una cuenta sin ninguna pantalla todavia puede ver su perfil.
 */
export function HomeRedirect() {
  const account = useSession((state) => state.account)
  const screens = useShellScreens()

  if (account === null) {
    return <Navigate to={paths.login} replace />
  }
  const first = entriesFor(screens, account.permissions).at(0)
  return <Navigate to={first?.to ?? paths.profile} replace />
}
