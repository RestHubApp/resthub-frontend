import { useMutationState } from '@tanstack/react-query'
import { type ComponentType, type ReactElement, Suspense } from 'react'

import { twoFactorConfirmKey } from '@/api/twoFactor'
import type { PlatformSession, Session } from '@/api/types'
import '@/store/accountSetup'
import { ReauthenticationHost } from './ReauthenticationHost'

/** Las pantallas que tapan el armazón hasta completar la cuenta; las pasa el router (viven en `features/auth`). */
export interface AccountSetupViews {
  /** Cambiar la contraseña temporal (RFS-20), del personal o de la administración del sistema. */
  readonly passwordChange?: ComponentType<{ readonly account: Session }> | undefined
  /** Activar la verificación en dos pasos, obligatoria para la administración del sistema (RFS-22). */
  readonly twoFactorSetup?: ComponentType<{ readonly account: PlatformSession }> | undefined
}

interface AccountSetupGateProps {
  readonly account: Session
  readonly views: AccountSetupViews
  readonly children: ReactElement
}

/**
 * Si la cuenta de plataforma sigue en el alta de los dos pasos. Tras confirmar
 * el primer código, la cuenta releída (`GET /auth/me` cada cinco minutos, o la
 * renovación del token) ya no la pide, pero los códigos de recuperación, que no
 * se vuelven a mostrar, siguen en pantalla: el alta se queda hasta «Ya los
 * guardé», que borra esa confirmación.
 */
function useIsSettingUpTwoFactor(account: Session): boolean {
  const confirmed = useMutationState({ filters: { mutationKey: twoFactorConfirmKey, status: 'success' } }).length
  return account.kind === 'platform' && (account.two_factor_setup_required || confirmed > 0)
}

function pendingView(account: Session, views: AccountSetupViews, isSettingUpTwoFactor: boolean): ReactElement | null {
  if (account.preview) return null
  // Primero la contraseña: hasta cambiar la temporal, el servidor tampoco deja activar los dos pasos.
  if (account.must_change_password && views.passwordChange !== undefined) {
    return <views.passwordChange account={account} />
  }
  if (isSettingUpTwoFactor && account.kind === 'platform' && views.twoFactorSetup !== undefined) {
    return <views.twoFactorSetup account={account} />
  }
  return null
}

/**
 * Mientras a la cuenta le falte algo que el servidor exige antes de dejarla
 * trabajar, en vez del armazón se ve solo eso: sin menú, sin pantallas y sin el
 * canal de avisos, que el servidor también rechaza hasta entonces. Solo queda
 * «Confirma tu contraseña»: activar los dos pasos la pide (RFS-21) y, sin el
 * armazón, nadie más la monta. La vista previa nunca lo tiene.
 */
export function AccountSetupGate({ account, views, children }: AccountSetupGateProps) {
  const pending = pendingView(account, views, useIsSettingUpTwoFactor(account))
  if (pending === null) return children
  return (
    <>
      <Suspense fallback={null}>{pending}</Suspense>
      <ReauthenticationHost />
    </>
  )
}
