// Lo que se recomienda una sola vez, justo después de entrar por el formulario
// de acceso (`useLogin` lo arma): no al recargar la página ni al recuperar la
// sesión de la cookie. Cerrar la sesión lo olvida. Vive fuera del paquete
// principal: lo bajan el acceso y el aviso que lo usa.
import { create } from 'zustand'

import { useSession } from './session'

interface SignInTipState {
  /** Acaba de entrar una cuenta y todavía no vio la recomendación. */
  readonly pending: boolean
  readonly arm: () => void
  readonly dismiss: () => void
}

export const useSignInTip = create<SignInTipState>((set) => ({
  pending: false,
  arm: () => {
    set({ pending: true })
  },
  dismiss: () => {
    set({ pending: false })
  },
}))

useSession.subscribe((state) => {
  if (state.account === null) {
    useSignInTip.setState({ pending: false })
  }
})
