import { Outlet } from 'react-router'

import type { CurrentUserResponse } from '@/api/types'
import { AccessibilityWidget } from '@/components/AccessibilityWidget'
import { BottomNav } from './BottomNav'
import { entriesFor } from './navigation'
import { PreviewBannerGate } from './PreviewBannerGate'
import { ServerFailureNotice } from './ServerFailureNotice'
import { SignedInHeader } from './SignedInHeader'
import { type ShellScreen, ShellScreensContext } from './shellScreens'
import { SideNav } from './SideNav'
import { SkipLink } from './SkipLink'
import { ToastStack } from './ToastStack'

interface SignedInShellProps {
  readonly account: CurrentUserResponse
  readonly screens: readonly ShellScreen[]
}

/**
 * El armazón con sesión: menú lateral en pantallas anchas, barra inferior en el
 * celular, el aviso de la vista previa y el aviso de fallas del servidor.
 */
export function SignedInShell({ account, screens }: SignedInShellProps) {
  const entries = entriesFor(screens, account.permissions)

  return (
    <ShellScreensContext value={screens}>
      <PreviewBannerGate account={account} />
      <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
        <SkipLink />
        <AccessibilityWidget />
        <ToastStack />
        <SideNav entries={entries} account={account} />

        <div className="flex min-h-dvh min-w-0 flex-col">
          <SignedInHeader restaurantName={account.restaurant.name} />
          <ServerFailureNotice />
          <main
            id="contenido"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1100px] flex-1 px-4 pt-6 pb-28 outline-none sm:px-6 lg:pb-8"
          >
            <Outlet />
          </main>
        </div>

        <BottomNav entries={entries} account={account} />
      </div>
    </ShellScreensContext>
  )
}
