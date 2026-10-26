import { type ComponentType, type ReactElement, Suspense } from 'react'

import type { Session } from '@/api/types'
import '@/store/accountSetup'

/** Las pantallas que tapan el armazón hasta completar la cuenta; las pasa el router (viven en `features/auth`). */
export interface AccountSetupViews {
  /** Cambiar la contraseña temporal (RFS-20), del personal o de la administración del sistema. */
  readonly passwordChange?: ComponentType<{ readonly account: Session }> | undefined
  /** Activar la verificación en dos pasos, obligatoria para la administración del sistema y para quien administra el personal (RFS-22). */
  readonly twoFactorSetup?: ComponentType<{ readonly account: Session }> | undefined
}

interface AccountSetupGateProps {
  readonly account: Session
  readonly views: AccountSetupViews
  readonly children: ReactElement
}

function pendingView(account: Session, views: AccountSetupViews): ReactElement | null {
  if (account.preview) return null
  // Primero la contraseña: hasta cambiar la temporal, el servidor tampoco deja activar los dos pasos.
  if (account.must_change_password && views.passwordChange !== undefined) {
    return <views.passwordChange account={account} />
  }
  if (account.two_factor_setup_required && views.twoFactorSetup !== undefined) {
    return <views.twoFactorSetup account={account} />
  }
  return null
}

/**
 * Mientras a la cuenta le falte algo que el servidor exige antes de dejarla
 * trabajar, en vez del armazón se ve solo eso: sin menú, sin pantallas y sin el
 * canal de avisos, que el servidor también rechaza hasta entonces. La vista
 * previa nunca lo tiene.
 */
export function AccountSetupGate({ account, views, children }: AccountSetupGateProps) {
  const pending = pendingView(account, views)
  if (pending === null) return children
  return <Suspense fallback={null}>{pending}</Suspense>
}
