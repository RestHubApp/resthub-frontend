import { createElement } from 'react'

import type { Session } from '@/api/types'

/** Una pantalla de puesta a punto de mentira: solo dice qué pide y para quién. */
function fakeSetupView(asks: string) {
  function FakeSetupView({ account }: { readonly account: Session }) {
    const name = account.kind === 'staff' ? account.user.full_name : account.admin.full_name
    return createElement('h1', null, `${asks}, ${name}`)
  }
  return FakeSetupView
}

export const FAKE_SETUP_VIEWS = {
  passwordChange: fakeSetupView('Cambia tu contraseña'),
  twoFactorSetup: fakeSetupView('Activa los dos pasos'),
}
