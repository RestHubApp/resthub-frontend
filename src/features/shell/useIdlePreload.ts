import { useEffect } from 'react'

import { useSession } from '../../store/session'
import { allowedScreens, ignorar, type ScreenPreload } from './screenPreload'

// Sin `requestIdleCallback` (Safari), una pausa corta hace de "cuando haya tiempo".
const SIN_IDLE_MS = 200
// Tope de espera: en una pantalla que nunca queda ociosa, igual se descarga.
const IDLE_TIMEOUT_MS = 3000

function cuandoHayaTiempo(callback: () => void): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS })
    return () => {
      window.cancelIdleCallback(id)
    }
  }
  const id = setTimeout(callback, SIN_IDLE_MS)
  return () => {
    clearTimeout(id)
  }
}

/** Baja los archivos de a uno, cada uno en un momento ocioso. Devuelve cómo parar. */
function bajarEnCola(pendientes: (() => Promise<unknown>)[]): () => void {
  const estado = { activo: true, cancelar: (): void => undefined }
  const siguiente = (): void => {
    const load = pendientes.shift()
    if (load === undefined || !estado.activo) {
      return
    }
    estado.cancelar = cuandoHayaTiempo(() => {
      // Si falla, la ruta lo vuelve a pedir al abrir la pantalla.
      void load().catch(ignorar).finally(siguiente)
    })
  }
  siguiente()
  return () => {
    estado.activo = false
    estado.cancelar()
  }
}

/**
 * Con la sesión abierta, baja uno a uno los archivos de las pantallas que la
 * cuenta puede abrir, cuando el navegador no tiene otra cosa que hacer.
 *
 * Solo el código: los datos se piden al acercarse a un enlace, porque traer
 * todas las pantallas por adelantado costaría un viaje al servidor por cada
 * una aunque la persona no las abra.
 */
export function useIdlePreload(screens: readonly ScreenPreload[]): void {
  const permissions = useSession((state) => state.account?.permissions)

  useEffect(() => {
    if (permissions === undefined) {
      return undefined
    }
    return bajarEnCola(
      allowedScreens(screens, permissions).flatMap((screen) =>
        screen.load === undefined ? [] : [screen.load],
      ),
    )
  }, [screens, permissions])
}
