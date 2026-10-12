import { Outlet } from 'react-router'

import type { Session } from '@/api/types'
import { BottomNav } from './BottomNav'
import { PreviewBannerGate } from './PreviewBannerGate'
import { ServerFailureNotice } from './ServerFailureNotice'
import { ShellOverlays } from './ShellOverlays'
import { SignedInHeader } from './SignedInHeader'
import { type ShellScreen, ShellScreensContext } from './shellScreens'
import { SideNav } from './SideNav'
import { SkipLink } from './SkipLink'
import { useMenuLayout } from './useMenuLayout'

interface SignedInShellProps {
  readonly account: Session
  readonly screens: readonly ShellScreen[]
}

/**
 * El armazón con sesión, el mismo para el personal y para la administración del
 * sistema: menú lateral en pantallas anchas, barra inferior en el celular, el
 * aviso de la vista previa y el aviso de fallas del servidor. Lo único que
 * cambia son las entradas del menú (las que los permisos de la cuenta dejan
 * abrir, en el orden que ella eligió en «Apariencia») y el nombre de arriba.
 */
export function SignedInShell({ account, screens }: SignedInShellProps) {
  const { ordered, bar, rest } = useMenuLayout(screens, account)

  return (
    <ShellScreensContext value={screens}>
      <PreviewBannerGate account={account} />
      <div className="min-h-dvh lg:grid lg:grid-cols-[min(15rem,26vw)_1fr]">
        <SkipLink />
        <ShellOverlays entries={ordered} account={account} />
        <SideNav entries={ordered} account={account} />

        <div className="flex min-h-dvh min-w-0 flex-col">
          <SignedInHeader account={account} />
          <ServerFailureNotice />
          <main
            id="contenido"
            tabIndex={-1}
            className="mx-auto w-full max-w-app flex-1 px-4 pt-6 pb-28 outline-none sm:px-6 lg:pb-20"
          >
            <Outlet />
          </main>
        </div>

        <BottomNav bar={bar} rest={rest} account={account} />
      </div>
    </ShellScreensContext>
  )
}
