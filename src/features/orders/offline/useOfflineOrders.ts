import { useEffect } from 'react'

import { useQueuedOrders } from '@/store/offlineQueue'
import { useSendQueuedOrders } from '@/store/queuedDelivery'
import { useStaffAccount } from '@/store/session'

// Mientras haya pedidos esperando, se reintenta cada medio minuto por si el
// navegador no avisa que volvió la señal (pasa en algunos celulares).
const RETRY_MS = 30_000

/**
 * Los pedidos tomados sin señal y el envío automático al volver la conexión.
 *
 * Cada uno se abre con su `client_request_id` (el servidor no lo duplica) y
 * se manda a cocina; si ya estaba en cocina, el 409 se toma como hecho. Un
 * rechazo de verdad (plato agotado, mesa ocupada) se avisa y sale de la cola.
 * El envío vive en `store/queuedDelivery`, que comparte con el indicador de
 * conexión del armazón.
 */
export function useOfflineOrders() {
  const pending = useQueuedOrders(useStaffAccount())
  const send = useSendQueuedOrders()

  useEffect(() => {
    void send()
    const onBack = () => {
      void send()
    }
    window.addEventListener('online', onBack)
    const timer = window.setInterval(onBack, RETRY_MS)
    return () => {
      window.removeEventListener('online', onBack)
      window.clearInterval(timer)
    }
  }, [send])

  return { pending, send }
}
