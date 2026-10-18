// La contraseña temporal (RFS-20): si el servidor responde 403
// `password_change_required` (otra pestaña, o una cuenta que la plataforma
// acaba de restablecer), la sesión la marca y el armazón muestra el cambio.
import { setPasswordChangeHandler } from '@/services/apiCredentials'
import { staffOf, useSession } from './session'

/** Marca que la cuenta del personal tiene que cambiar su contraseña antes de seguir. */
function markPasswordChangeRequired(): void {
  const { account, refresh } = useSession.getState()
  const staff = staffOf(account)
  if (staff === null || staff.must_change_password) return
  refresh({ ...staff, must_change_password: true })
}

setPasswordChangeHandler(markPasswordChangeRequired)
