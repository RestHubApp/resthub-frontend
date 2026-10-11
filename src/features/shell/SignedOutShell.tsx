import { Outlet } from 'react-router'

import { AccessibilityWidget } from '@/components/AccessibilityWidget'
import { paths } from '@/services/paths'
import { Brand } from './Brand'
import { SkipLink } from './SkipLink'

/** El armazón sin sesión: la marca arriba y el acceso al centro. */
export function SignedOutShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />
      <AccessibilityWidget />
      <header className="mx-auto flex w-full max-w-5xl px-4 pt-5 sm:px-6">
        <Brand to={paths.login} />
      </header>
      <main id="contenido" tabIndex={-1} className="flex flex-1 flex-col px-4 py-6 outline-none sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
