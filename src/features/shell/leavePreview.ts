import { closeTabOrGo } from '../../services/leaveTab'
import { discardQueued, ownerOf } from '../../store/offlineQueue'
import { useSession } from '../../store/session'

/** Adónde vuelve la pestaña si el navegador no la deja cerrar. */
const VUELTA = '/plataforma/vista-previa'

/**
 * Sale de la vista previa: descarta lo que quedó en su cola, borra su sesión
 * y cierra la pestaña o vuelve a la administración del sistema.
 *
 * Los pedidos en cola son del local de muestra y la pestaña ya no va a tener
 * con qué enviarlos. Lo del navegador (la sesión real y su cola, la sesión de
 * plataforma) no se toca.
 */
export function leavePreview(): void {
  const { account, exitPreview } = useSession.getState()
  discardQueued(ownerOf(account))
  exitPreview()
  closeTabOrGo(VUELTA)
}
