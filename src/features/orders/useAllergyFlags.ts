import { PERMISSION } from '@/api/permissions'
import { useOrderNoteFlags, type OrderNoteFlags } from '@/hooks/useOrderNoteFlags'
import { useCan } from '@/store/session'

/**
 * Las alergias que la IA marco en las notas de unos pedidos.
 *
 * Las ve quien tiene el permiso del panel; el resto ve las notas tal cual.
 * No abre su propia escucha: la pantalla ya escucha el canal de avisos y
 * `useLiveUpdates` refresca las notas con el tema `insights`.
 */
export function useAllergyFlags(orderIds: readonly number[]): OrderNoteFlags {
  const canViewAllergies = useCan(PERMISSION.insightsRead)
  return useOrderNoteFlags(orderIds, { enabled: canViewAllergies, live: false })
}
