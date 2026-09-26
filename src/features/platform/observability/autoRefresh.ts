/** Cada cuánto se relee el panel mientras se mira. */
export const AUTO_REFRESH_MS = 30_000

/**
 * Cada cuánto releer, o `false` para no releer.
 *
 * Solo con la pestaña a la vista y sin pausa: un panel olvidado en una
 * pestaña de fondo no le pide nada al servidor.
 */
export function refreshInterval(paused: boolean, visibility: DocumentVisibilityState): number | false {
  return !paused && visibility === 'visible' ? AUTO_REFRESH_MS : false
}

/** Qué dice el panel de su actualización. */
export function refreshStatus(paused: boolean, visibility: DocumentVisibilityState): string {
  if (paused) {
    return 'Actualización en pausa'
  }
  return visibility === 'visible' ? 'Se actualiza cada 30 s' : 'En espera mientras la pestaña no está a la vista'
}
