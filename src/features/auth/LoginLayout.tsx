import type { ReactNode } from 'react'

import { Brand } from '@/components/Brand'
import { PublicFooter } from '@/components/PublicFooter'
import { paths } from '@/services/paths'
import { LoginPanel } from './LoginPanel'

interface LoginLayoutProps {
  readonly children: ReactNode
}

/**
 * La composición del acceso a pantalla completa.
 *
 * El formulario manda: va primero, centrado en su columna y con la marca justo
 * encima. En pantallas anchas el panel de marca ocupa el resto a toda la
 * altura; en el celular no hay panel y el formulario queda solo. La
 * El pie (privacidad, derechos y accesibilidad) cierra la columna.
 */
export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-6">
          <Brand to={paths.login} />
          {children}
        </div>
        <div className="mx-auto w-full max-w-sm pb-14 sm:pb-0">
          <div className="sm:w-md">
            <PublicFooter privacyTo={paths.privacy} rightsTo={paths.privacyRights} />
          </div>
        </div>
      </div>
      <LoginPanel />
    </div>
  )
}
