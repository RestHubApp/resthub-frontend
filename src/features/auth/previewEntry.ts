import { redirect } from 'react-router'

import { exchangePreviewCode, sessionOf } from '../../api/auth'
import { errorStatus } from '../../services/api'
import { logger } from '../../services/logger'
import { isPreviewTab } from '../../services/tabStorage'
import { useSession } from '../../store/session'
import { failureOf, previewCodeFrom, type PreviewEntryFailure, withoutHash } from './previewCode'

/** Lo que ve la pantalla de canje: por qué falló, o que la pestaña se está recargando. */
export type PreviewEntryResult = PreviewEntryFailure | 'reloading'

/**
 * Canjea el código de vista previa y entra a la aplicación con esa sesión.
 *
 * Es el `loader` de `/vista-previa` y no un efecto de la pantalla: corre una
 * sola vez por carga (el modo estricto de React repite los efectos, y un
 * código de un solo uso canjeado dos veces falla la segunda). El código sale
 * de la barra de direcciones antes de mandarlo, para que no quede en el
 * historial ni se vea en la pantalla.
 */
export async function previewEntryLoader(): Promise<PreviewEntryResult | Response> {
  // Solo una pestaña cargada en esta ruta guarda la sesión en su
  // `sessionStorage`. Si se llegó navegando dentro de la aplicación, se carga
  // de nuevo, con el código todavía en la dirección.
  if (!isPreviewTab()) {
    window.location.reload()
    return 'reloading'
  }

  const codigo = previewCodeFrom(window.location.hash)
  window.history.replaceState(window.history.state, '', withoutHash(window.location))

  if (codigo === null) {
    return useSession.getState().account?.preview === true ? redirect('/') : 'missing'
  }

  try {
    const respuesta = await exchangePreviewCode({ code: codigo })
    if (!respuesta.preview) {
      logger.error('auth.preview_not_marked')
      return 'failed'
    }
    useSession.getState().startPreview(respuesta.access_token, sessionOf(respuesta))
    return redirect('/')
  } catch (error) {
    const motivo = failureOf(errorStatus(error))
    logger.warn({ reason: motivo }, 'auth.preview_exchange_failed')
    return motivo
  }
}
