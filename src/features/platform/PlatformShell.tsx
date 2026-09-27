import { Outlet } from 'react-router'

import AccessibilityWidget from '../../components/AccessibilityWidget'
import ApiFailureNotice from '../../components/ApiFailureNotice'
import { useFailedQueries } from '../../hooks/useFailedQueries'
import PlatformHeader from './PlatformHeader'
import { usePlatformSessionUpkeep } from './usePlatformSessionUpkeep'

const SKIP_LINK = (
  <a
    href="#contenido"
    className="sr-only rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
  >
    Saltar al contenido
  </a>
)

/**
 * El armazón del área de plataforma (`/plataforma`).
 *
 * No comparte nada con el de un restaurante: ni su menú, ni su sesión, ni
 * sus avisos. Sin sesión de plataforma solo se ve el acceso, con la misma
 * franja arriba para que se sepa dónde se está entrando.
 */
export default function PlatformShell() {
  usePlatformSessionUpkeep()
  const failed = useFailedQueries('platform')

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {SKIP_LINK}
      <AccessibilityWidget />
      <PlatformHeader />
      <ApiFailureNotice message={failed.message} onRetry={failed.retry} />
      <main
        id="contenido"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-4 pt-6 pb-10 outline-none sm:px-6"
      >
        <Outlet />
      </main>
    </div>
  )
}
