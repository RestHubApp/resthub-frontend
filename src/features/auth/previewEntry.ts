import { exchangePreviewCode, staffSessionOf } from '@/api/auth'
import { logger } from '@/services/logger'
import { isPreviewTab, previewEntryUrl, takeEntryFragment } from '@/services/tabStorage'
import { useSession } from '@/store/session'
import { failureOf, previewCodeFrom, type PreviewEntryFailure, withoutHash } from './previewCode'

/** Lo que ve la pantalla de canje: por qué falló, o que la pestaña se está recargando. */
export type PreviewEntryResult = PreviewEntryFailure | 'reloading'

/** En qué terminó la llegada a la ruta de canje: `entered` lleva al inicio con la sesión de vista previa. */
export type PreviewEntryOutcome = PreviewEntryResult | 'entered'

/**
 * Saca el código de la dirección y deja la barra limpia.
 *
 * El código se sacó de la barra al cargar la página (`tabStorage`). Si esta
 * pestaña de vista previa llegó acá navegando, puede seguir en la dirección.
 */
function takeCode(): string | null {
  const fragment = takeEntryFragment() ?? window.location.hash
  if (window.location.hash !== '') {
    window.history.replaceState(window.history.state, '', withoutHash(window.location))
  }
  return previewCodeFrom(fragment)
}

/** Sin código: quien ya está en una vista previa sigue al inicio; los demás ven el aviso. */
function withoutCode(): PreviewEntryOutcome {
  return useSession.getState().account?.preview === true ? 'entered' : 'missing'
}

/** Canjea el código y abre la sesión de vista previa, o devuelve por qué falló. */
async function exchange(code: string): Promise<PreviewEntryOutcome> {
  try {
    const response = await exchangePreviewCode({ code: code })
    if (!response.preview) {
      logger.error('auth.preview_not_marked')
      return 'failed'
    }
    useSession.getState().startPreview(response.access_token, staffSessionOf(response))
    return 'entered'
  } catch (error) {
    const reason = failureOf(error)
    logger.warn({ reason: reason }, 'auth.preview_exchange_failed')
    return reason
  }
}

/**
 * Canjea el código de vista previa y entra a la aplicación con esa sesión.
 *
 * El código ya salió de la barra al cargar la página, antes de bajar este
 * archivo, para que no quede en el historial ni se vea en la pantalla aunque el
 * archivo no llegue.
 */
export async function enterPreview(): Promise<PreviewEntryOutcome> {
  // Solo una pestaña cargada en esta ruta guarda la sesión en su
  // `sessionStorage`. Si se llegó navegando dentro de la aplicación, se carga
  // de nuevo, con el código todavía en la dirección. No se recarga «lo mismo»:
  // se carga la ruta de canje escrita como la escribe la aplicación, que al
  // cargar siempre elige una pestaña de vista previa, así que esto pasa una
  // sola vez y no puede quedar recargando.
  if (!isPreviewTab()) {
    window.location.replace(`${previewEntryUrl()}${window.location.search}${window.location.hash}`)
    return 'reloading'
  }

  const code = takeCode()
  return code === null ? withoutCode() : exchange(code)
}

let lastEntry: { readonly key: string; readonly outcome: Promise<PreviewEntryOutcome> } | undefined

/**
 * `enterPreview` una sola vez por llegada a la ruta (`key` es la de la
 * navegación, `useLocation().key`).
 *
 * La pantalla lo lee con `use` durante el render, y el modo estricto de React
 * renderiza dos veces: sin esto, el código de un solo uso se canjearía dos
 * veces y la segunda fallaría. Volver a la ruta es otra navegación, con otra
 * `key`, y vuelve a correr.
 */
export function enterPreviewOnce(key: string): Promise<PreviewEntryOutcome> {
  if (lastEntry?.key !== key) {
    lastEntry = { key: key, outcome: enterPreview() }
  }
  return lastEntry.outcome
}
