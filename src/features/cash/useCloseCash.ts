import { useState } from 'react'

import { closeCash } from '@/api/cash'
import type { CashSession, CloseCashRequest } from '@/api/types'
import { toCents } from '@/services/format'
import { differenceLabel } from './cashDifference'
import { useCashMutation } from './useCashMutation'

/**
 * El cierre de caja con su confirmación.
 *
 * Cerrar mueve dinero y no se deshace: un monto válido abre la confirmación
 * (`ask`) y solo al confirmarla (`confirm`) sale el cierre. Enter en el monto
 * hace lo mismo.
 */
export function useCloseCash(onClosed: (session: CashSession) => void) {
  const [toConfirm, setToConfirm] = useState<CloseCashRequest | null>(null)
  const close = useCashMutation({
    mutationFn: (payload: CloseCashRequest) => closeCash(payload),
    success: (closed) => `Caja cerrada. ${differenceLabel(toCents(closed.difference ?? '0'))}.`,
    failure: 'No se pudo cerrar la caja.',
    onSuccess: onClosed,
  })

  return {
    isPending: close.isPending,
    isConfirming: toConfirm !== null,
    ask: setToConfirm,
    cancel: () => {
      setToConfirm(null)
    },
    confirm: () => {
      if (toConfirm !== null) {
        close.mutate(toConfirm)
      }
      setToConfirm(null)
    },
  }
}
