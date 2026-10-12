import type { Session } from '@/api/types'
import { AccessibilityWidget } from '@/components/AccessibilityWidget'
import type { NavEntry } from './navigation'
import { QuickPaletteHost } from './quick/QuickPaletteHost'
import { ToastStack } from './ToastStack'

/** Lo que flota sobre la pantalla con sesión: el botón de accesibilidad, los avisos y la paleta de comandos. */
export function ShellOverlays({ entries, account }: { readonly entries: readonly NavEntry[]; readonly account: Session }) {
  return (
    <>
      <AccessibilityWidget />
      <ToastStack />
      <QuickPaletteHost entries={entries} account={account} />
    </>
  )
}
