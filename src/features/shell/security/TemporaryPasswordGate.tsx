import { type ComponentType, type ReactElement, Suspense } from 'react'

import type { Session, StaffSession } from '@/api/types'
import '@/store/temporaryPassword'

/** La pantalla que cambia la contraseña temporal; la pasa el router (vive en `features/auth`). */
export type PasswordChangeView = ComponentType<{ readonly account: StaffSession }>

interface TemporaryPasswordGateProps {
  readonly account: Session
  readonly view?: PasswordChangeView | undefined
  readonly children: ReactElement
}

/**
 * Con la contraseña temporal (RFS-20), en vez del armazón se ve solo el
 * cambio: sin menú, sin pantallas y sin el canal de avisos, que el servidor
 * también rechaza hasta entonces. La vista previa nunca la tiene.
 */
export function TemporaryPasswordGate({ account, view: View, children }: TemporaryPasswordGateProps) {
  if (View === undefined || account.kind !== 'staff' || !account.must_change_password || account.preview) {
    return children
  }
  return (
    <Suspense fallback={null}>
      <View account={account} />
    </Suspense>
  )
}
