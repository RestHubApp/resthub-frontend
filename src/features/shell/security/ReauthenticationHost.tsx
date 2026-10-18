import { Suspense } from 'react'

import { lazyNamed } from '@/components/lazyNamed'
import { useReauthentication } from '@/store/reauthentication'

// Se descarga recién cuando una acción crítica pide la contraseña: el mesero no la baja nunca.
const ReauthenticationDialog = lazyNamed(() => import('./ReauthenticationDialog'), 'ReauthenticationDialog')

/** Monta la ventana «Confirma tu contraseña» mientras una acción crítica la espera. */
export function ReauthenticationHost() {
  const isAsking = useReauthentication((state) => state.isAsking)
  if (!isAsking) return null
  return (
    <Suspense fallback={null}>
      <ReauthenticationDialog />
    </Suspense>
  )
}
