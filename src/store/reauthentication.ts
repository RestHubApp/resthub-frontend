import { create } from 'zustand'

import { setReauthenticationHandler } from '@/services/apiCredentials'

interface ReauthenticationState {
  /** Una acción crítica espera que la persona confirme su contraseña. */
  isAsking: boolean
  /**
   * Pide la contraseña y resuelve `true` si la persona la confirmó. Varias
   * peticiones a la vez comparten la misma ventana.
   */
  ask: () => Promise<boolean>
  /** Cierra la ventana: `true` si se confirmó, `false` si se desistió. */
  settle: (isConfirmed: boolean) => void
}

const waiting: ((isConfirmed: boolean) => void)[] = []

/**
 * La ventana «Confirma tu contraseña» de las acciones críticas (RFS-21): datos
 * fiscales y SOL, certificado, roles, desactivar una cuenta o un local, el PIN
 * y la verificación en dos pasos. El cliente HTTP la pide al recibir 403
 * `reauthentication_required` y repite la acción si se confirma.
 */
export const useReauthentication = create<ReauthenticationState>((set) => ({
  isAsking: false,
  ask: () =>
    new Promise<boolean>((resolve) => {
      waiting.push(resolve)
      set({ isAsking: true })
    }),
  settle: (isConfirmed) => {
    for (const resolve of waiting.splice(0)) resolve(isConfirmed)
    set({ isAsking: false })
  },
}))

setReauthenticationHandler(() => useReauthentication.getState().ask())
