import { Suspense } from 'react'

import type { Session } from '@/api/types'
import { AccessibilityWidget } from '@/components/AccessibilityWidget'
import { lazyNamed } from '@/components/lazyNamed'
import type { NavEntry } from './navigation'
import { QuickPaletteHost } from './quick/QuickPaletteHost'
import { ReauthenticationHost } from './security/ReauthenticationHost'
import { recommendsTwoFactor } from './security/twoFactorReminderRule'
import { ToastStack } from './ToastStack'

// Solo lo baja quien podría verlo: el mesero no lo descarga nunca.
const TwoFactorReminder = lazyNamed(() => import('./security/TwoFactorReminder'), 'TwoFactorReminder')

/** Lo que flota sobre la pantalla con sesión: el widget de accesibilidad (sin botón flotante), los avisos, la paleta de comandos, «Confirma tu contraseña» y, al entrar, la recomendación de la verificación en dos pasos. */
export function ShellOverlays({ entries, account }: { readonly entries: readonly NavEntry[]; readonly account: Session }) {
  const shouldRemindTwoFactor = recommendsTwoFactor(account)
  return (
    <>
      <AccessibilityWidget showLauncher={false} />
      <ToastStack />
      <QuickPaletteHost entries={entries} account={account} />
      <ReauthenticationHost />
      {shouldRemindTwoFactor ? (
        <Suspense fallback={null}>
          <TwoFactorReminder account={account} />
        </Suspense>
      ) : null}
    </>
  )
}
