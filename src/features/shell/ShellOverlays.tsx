import type { Session } from '@/api/types'
import { AccessibilityWidget } from '@/components/AccessibilityWidget'
import type { NavEntry } from './navigation'
import { QuickPaletteHost } from './quick/QuickPaletteHost'
import { ReauthenticationHost } from './security/ReauthenticationHost'
import { TwoFactorReminder } from './security/TwoFactorReminder'
import { ToastStack } from './ToastStack'

/** Lo que flota sobre la pantalla con sesión: el widget de accesibilidad (sin botón flotante), los avisos, la paleta de comandos, «Confirma tu contraseña» y, al entrar, la recomendación de la verificación en dos pasos. */
export function ShellOverlays({ entries, account }: { readonly entries: readonly NavEntry[]; readonly account: Session }) {
  return (
    <>
      <AccessibilityWidget showLauncher={false} />
      <ToastStack />
      <QuickPaletteHost entries={entries} account={account} />
      <ReauthenticationHost />
      <TwoFactorReminder account={account} />
    </>
  )
}
