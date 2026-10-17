import { useNavigate } from 'react-router'

import { reportSignOut } from '@/api/auth'
import { paths } from '@/services/paths'
import { type QueuedOrder, useQueuedOrders } from '@/store/offlineQueue'
import { useSession, useStaffAccount } from '@/store/session'

/** El aviso antes de salir con pedidos que todavía no llegaron al servidor. */
export function pendingOrdersNotice(pending: readonly QueuedOrder[]): { readonly title: string; readonly description: string } {
  const howMany =
    pending.length === 1 ? 'Un pedido tuyo espera' : `${String(pending.length)} pedidos tuyos esperan`
  return {
    title: '¿Cerrar sesión con pedidos sin enviar?',
    description: `${howMany} señal: ${pending.map((order) => order.label).join(', ')}. Quedan guardados en este celular y se envían cuando vuelvas a entrar con tu cuenta.`,
  }
}

/**
 * Cerrar la sesión: la acción de «Cerrar sesión» del menú y de la paleta.
 *
 * `pending` son los pedidos de esta cuenta que esperan señal; quien ofrece la
 * salida los avisa antes (`pendingOrdersNotice`). `signOut` vacía la sesión y
 * va al acceso en el mismo evento: React aplica los dos cambios juntos, así que
 * ninguna pantalla privada llega a dibujarse sin cuenta. Antes avisa la salida
 * al servidor (`reportSignOut`), que cierra la sesión de este dispositivo, sin
 * esperarla: si falla, la salida sigue igual y la sesión vence sola.
 */
export function useSignOut() {
  const clearSession = useSession((state) => state.signOut)
  const pending = useQueuedOrders(useStaffAccount())
  const navigate = useNavigate()

  return {
    pending,
    signOut: () => {
      // Salir cierra la sesión de este dispositivo en el servidor (y, en el
      // personal, deja asiento en la bitácora). La vista previa no tiene una.
      const { token, account } = useSession.getState()
      if (token !== null && account !== null && !account.preview) {
        void reportSignOut(token)
      }
      clearSession()
      void navigate(paths.login, { replace: true })
    },
  }
}
