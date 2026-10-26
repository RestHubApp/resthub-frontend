// Lo que se recomienda una sola vez, justo después de entrar: no al recargar la
// página ni al recuperar la sesión de la cookie, solo cuando en la pestaña entra
// otra cuenta (también si antes había una, como la de la plataforma). Renovar el
// token o releer la sesión no cuentan. Cerrar la sesión lo olvida.
import type { Session } from '@/api/types'
import { create } from 'zustand'

import { useSession } from './session'

/** Quién es la cuenta, sin lo que cambia al renovar o releer la sesión. */
function whoIs(account: Session | null): string | null {
  if (account === null) return null
  return account.kind === 'staff' ? `staff:${String(account.user.id)}` : `platform:${String(account.admin.id)}`
}

interface SignInTipState {
  /** Acaba de entrar una cuenta y todavía no vio la recomendación. */
  readonly pending: boolean
  readonly dismiss: () => void
}

export const useSignInTip = create<SignInTipState>((set) => ({
  pending: false,
  dismiss: () => {
    set({ pending: false })
  },
}))

useSession.subscribe((state, previous) => {
  const now = whoIs(state.account)
  if (now === null) {
    useSignInTip.setState({ pending: false })
  } else if (now !== whoIs(previous.account)) {
    useSignInTip.setState({ pending: true })
  }
})
