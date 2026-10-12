import type { Session } from '@/api/types'
import { AccessibilityWidget } from '@/components/AccessibilityWidget'
import type { NavEntry } from './navigation'
import { QuickPaletteHost } from './quick/QuickPaletteHost'
import { ToastStack } from './ToastStack'

/** Lo que flota sobre la pantalla con sesión: el widget de accesibilidad (sin botón flotante), los avisos y la paleta de comandos. */
export function ShellOverlays({ entries, account }: { readonly entries: readonly NavEntry[]; readonly account: Session }) {
  return (
    <>
      <AccessibilityWidget showLauncher={false} />
      <ToastStack />
      <QuickPaletteHost entries={entries} account={account} />
    </>
  )
}
