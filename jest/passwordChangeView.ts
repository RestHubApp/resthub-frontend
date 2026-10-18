import { createElement } from 'react'

import type { StaffSession } from '@/api/types'

/** Una pantalla de cambio de contraseña de mentira: solo dice para quién es. */
export function FakePasswordChangeView({ account }: { readonly account: StaffSession }) {
  return createElement('h1', null, `Cambia tu contraseña, ${account.user.full_name}`)
}
