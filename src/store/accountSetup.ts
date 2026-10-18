// Lo que el servidor exige antes de dejar trabajar a la cuenta: si responde 403
// `password_change_required` (RFS-20) o `two_factor_setup_required` (RFS-22),
// la sesión lo marca y el armazón muestra la pantalla que lo resuelve.
import { setPasswordChangeHandler, setTwoFactorSetupHandler } from '@/services/apiCredentials'
import { staffOf, useSession } from './session'

/** Marca que la cuenta del personal tiene que cambiar su contraseña antes de seguir. */
function markPasswordChangeRequired(): void {
  const { account, refresh } = useSession.getState()
  const staff = staffOf(account)
  if (staff === null || staff.must_change_password) return
  refresh({ ...staff, must_change_password: true })
}

/** Marca que la cuenta de plataforma tiene que activar la verificación en dos pasos. */
function markTwoFactorSetupRequired(): void {
  const { account, refresh } = useSession.getState()
  if (account?.kind !== 'platform' || account.two_factor_setup_required) return
  refresh({ ...account, two_factor_setup_required: true })
}

setPasswordChangeHandler(markPasswordChangeRequired)
setTwoFactorSetupHandler(markTwoFactorSetupRequired)
