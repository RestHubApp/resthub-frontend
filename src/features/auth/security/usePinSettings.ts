import { lockOwnSession, removeOwnPin, setOwnPin } from '@/api/accountSecurity'
import { useSession, useStaffAccount } from '@/store/session'
import { useNotifiedMutation } from '@/store/useNotifiedMutation'

/** Anota en la sesión si la cuenta tiene PIN: el desbloqueo lo ofrece según eso. */
function markPin(hasPin: boolean): void {
  const { account, refresh } = useSession.getState()
  if (account?.kind === 'staff') refresh({ ...account, has_pin: hasPin })
}

/** Elegir, cambiar o quitar el PIN de desbloqueo, y bloquear la sesión a mano (RFS-29). */
export function usePinSettings() {
  const account = useStaffAccount()
  const setLocked = useSession((state) => state.setLocked)
  const choose = useNotifiedMutation({
    mutationFn: (pin: string) => setOwnPin(pin),
    success: () => 'PIN guardado. Úsalo para desbloquear la sesión.',
    onSuccess: () => { markPin(true) },
  })
  const remove = useNotifiedMutation({
    mutationFn: removeOwnPin,
    success: () => 'PIN quitado: la sesión se desbloquea con la contraseña.',
    failure: 'No se pudo quitar el PIN.',
    onSuccess: () => { markPin(false) },
  })
  const lockNow = () => {
    setLocked(true)
    void lockOwnSession()
  }
  return { account, choose, remove, lockNow }
}
