import { useQuery } from '@tanstack/react-query'

import { restaurantQuery } from '@/api/restaurant'
import type { Ingredient } from '@/api/types'
import { FormMessage } from '@/components/FormMessage'
import { formatMoney, toCents } from '@/services/format'
import * as icons from '@/components/icons'

interface WasteApprovalNoticeProps {
  readonly ingredient: Ingredient
  /** Lo que se pierde, en la unidad base. */
  readonly base: number
}

/**
 * Avisa, antes de guardar, que la merma pasa el monto del local y quedará por
 * aprobar. El servidor es quien decide (con el costo vigente): esto solo anticipa.
 */
export function WasteApprovalNotice({ ingredient, base }: WasteApprovalNoticeProps) {
  const restaurant = useQuery(restaurantQuery)
  const threshold = restaurant.data?.waste_approval_threshold ?? null
  if (threshold === null || !Number.isFinite(base) || base <= 0) {
    return null
  }
  const value = toCents(base * Number(ingredient.unit_cost))
  if (value <= toCents(threshold)) {
    return null
  }
  return (
    <FormMessage tone="warning" icon={icons.notice} role="status">
      Pasa de {formatMoney(threshold)}: quedará <strong>por aprobar</strong> y el stock no cambia hasta que el
      encargado la apruebe.
    </FormMessage>
  )
}
