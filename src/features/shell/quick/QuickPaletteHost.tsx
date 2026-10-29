import { Suspense } from 'react'

import type { Session } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { NavEntry } from '@/features/shell/navigation'
import { pendingOrdersNotice, useSignOut } from '@/features/shell/useSignOut'
import { LazyQuickPalette } from './quickPaletteLoader'
import { useQuickPalette } from './quickState'
import { useQuickShortcut } from './useQuickShortcut'

interface QuickPaletteHostProps {
  readonly entries: readonly NavEntry[]
  readonly account: Session
}

/**
 * Donde vive la paleta dentro del armazón con sesión: el atajo Ctrl/Cmd+K, la
 * paleta perezosa (se monta la primera vez que se abre) y la confirmación de
 * «Cerrar sesión» cuando hay pedidos sin enviar.
 */
export function QuickPaletteHost({ entries, account }: QuickPaletteHostProps) {
  useQuickShortcut()
  const hasOpened = useQuickPalette((state) => state.hasOpened)
  const isSignOutAsked = useQuickPalette((state) => state.isSignOutAsked)
  const askSignOut = useQuickPalette((state) => state.askSignOut)
  const { pending, signOut } = useSignOut()
  const notice = pendingOrdersNotice(pending)

  return (
    <>
      {hasOpened ? (
        <Suspense fallback={null}>
          <LazyQuickPalette entries={entries} account={account} />
        </Suspense>
      ) : null}
      <ConfirmDialog
        open={isSignOutAsked}
        onOpenChange={askSignOut}
        title={notice.title}
        description={notice.description}
        confirmLabel="Cerrar sesión"
        confirmVariant="default"
        onConfirm={() => { signOut() }}
      />
    </>
  )
}
