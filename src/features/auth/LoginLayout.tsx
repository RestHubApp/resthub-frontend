import type { ReactNode } from 'react'

import { Brand } from '@/components/Brand'
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
 * altura disponible (el pie público del armazón queda debajo de ambos); en el
 * celular no hay panel y el formulario queda solo.
 */
export function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <div className="grid flex-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-6">
          <Brand to={paths.login} />
          {children}
        </div>
      </div>
      <LoginPanel />
    </div>
  )
}
