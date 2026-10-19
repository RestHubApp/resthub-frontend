import { createElement } from 'react'

import type { Session } from '@/api/types'

/** Una pantalla de puesta a punto de mentira: solo dice qué pide y para quién. */
function FakeSetupView({ account }: { readonly account: Session }) {
  return account.kind === 'staff'
    ? createElement('h1', null, `Cambia tu contraseña, ${account.user.full_name}`)
    : createElement('h1', null, `Activa los dos pasos, ${account.admin.full_name}`)
}

export const FAKE_SETUP_VIEWS = { passwordChange: FakeSetupView, twoFactorSetup: FakeSetupView }
