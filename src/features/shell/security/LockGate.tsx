import { type ReactElement, Suspense } from 'react'

import type { Session } from '@/api/types'
import { lazyNamed } from '@/components/lazyNamed'
import { useIdleLock } from './useIdleLock'

// Solo se descarga cuando la sesión se bloquea.
const LockScreen = lazyNamed(() => import('./LockScreen'), 'LockScreen')

interface LockGateProps {
  readonly account: Session
  readonly children: ReactElement
}

/**
 * El bloqueo por inactividad (RFS-29): cuenta el uso de la pantalla y, con la
 * sesión del personal bloqueada, muestra solo el desbloqueo. Nada del
 * restaurante queda a la vista hasta desbloquearla.
 */
export function LockGate({ account, children }: LockGateProps) {
  useIdleLock()
  if (account.kind !== 'staff' || !account.session_locked || account.preview) {
    return children
  }
  return (
    <Suspense fallback={null}>
      <LockScreen account={account} />
    </Suspense>
  )
}
