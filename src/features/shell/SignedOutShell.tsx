import { Outlet, useLocation } from 'react-router'

import { AccessibilityWidget } from '@/components/AccessibilityWidget'
import { paths } from '@/services/paths'
import { Brand } from '@/components/Brand'
import { SkipLink } from './SkipLink'

/**
 * El armazón sin sesión.
 *
 * El acceso ocupa toda la pantalla y trae su propia marca junto al formulario;
 * las demás pantallas públicas (la privacidad) llevan la marca arriba.
 */
export function SignedOutShell() {
  const isLogin = useLocation().pathname === paths.login

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SkipLink />
      <AccessibilityWidget />
      {isLogin ? null : (
        <header className="mx-auto flex w-full max-w-5xl px-4 pt-5 sm:px-6">
          <Brand to={paths.login} />
        </header>
      )}
      <main
        id="contenido"
        tabIndex={-1}
        className={`flex flex-1 flex-col outline-none ${isLogin ? '' : 'px-4 py-6 sm:px-6'}`}
      >
        <Outlet />
      </main>
    </div>
  )
}
