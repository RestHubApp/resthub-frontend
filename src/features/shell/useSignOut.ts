import { useNavigate } from 'react-router'

import { reportSignOut } from '@/api/auth'
import { paths } from '@/services/paths'
import { type QueuedOrder, discardCustomerDataOf, hasCustomerData, ownerOf, useQueuedOrders } from '@/store/offlineQueue'
import { staffOf, useSession, useStaffAccount } from '@/store/session'

function labels(orders: readonly QueuedOrder[]): string {
  return orders.map((order) => order.label).join(', ')
}

function whatHappens(discarded: readonly QueuedOrder[], kept: readonly QueuedOrder[]): string {
  const sentLater = 'se envían cuando vuelvas a entrar con tu cuenta.'
  if (discarded.length === 0) return `Quedan guardados en este celular y ${sentLater}`
  if (kept.length === 0) return 'Llevan datos del cliente: al salir se descartan, para que no queden en este celular.'
  return `Al salir se descartan los que llevan datos del cliente (${labels(discarded)}); los demás (${labels(kept)}) quedan guardados y ${sentLater}`
}

/**
 * El aviso antes de salir con pedidos que todavía no llegaron al servidor. Los
 * que guardan datos del cliente se descartan al salir; los demás se quedan.
 */
export function pendingOrdersNotice(pending: readonly QueuedOrder[]): { readonly title: string; readonly description: string } {
  const howMany =
    pending.length === 1 ? 'Un pedido tuyo espera' : `${String(pending.length)} pedidos tuyos esperan`
  const discarded = pending.filter(hasCustomerData)
  const kept = pending.filter((order) => !hasCustomerData(order))
  return {
    title: '¿Cerrar sesión con pedidos sin enviar?',
    description: `${howMany} señal: ${labels(pending)}. ${whatHappens(discarded, kept)}`,
  }
}

/**
 * Cerrar la sesión: la acción de «Cerrar sesión» del menú y de la paleta.
 *
 * `pending` son los pedidos de esta cuenta que esperan señal; quien ofrece la
 * salida los avisa antes (`pendingOrdersNotice`). Salir descarta los que guardan
 * datos del cliente (`discardCustomerDataOf`), salvo desde la sesión bloqueada,
 * que sale como si la sesión hubiera vencido. `signOut` vacía la sesión y
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
    signOut: (options: { readonly discardCustomerData: boolean } = { discardCustomerData: true }) => {
      // Salir cierra la sesión de este dispositivo en el servidor (y, en el
      // personal, deja asiento en la bitácora). La vista previa no tiene una.
      const { token, account } = useSession.getState()
      if (account !== null && !account.preview) {
        void reportSignOut(token)
      }
      if (options.discardCustomerData) {
        discardCustomerDataOf(ownerOf(staffOf(account)))
      }
      clearSession()
      void navigate(paths.login, { replace: true })
    },
  }
}
