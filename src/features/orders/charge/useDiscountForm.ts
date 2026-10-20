import { zodResolver } from '@hookform/resolvers/zod'

import { applyDiscount } from '@/api/orders'
import type { DiscountRequest, OrderResponse } from '@/api/types'
import { decimalForApi } from '@/components/formRules'
import { useAppForm } from '@/hooks/useAppForm'
import { formatPercent } from '@/services/format'
import { useOrderAction } from '@/features/orders/useOrderAction'
import { discountSchema, type DiscountValues } from './discountSchema'

/**
 * El formulario del descuento: validación, envío y aviso de resultado.
 *
 * Al aplicarse, llama a `onDone` para que quien lo muestra lo cierre.
 */
export function useDiscountForm(order: OrderResponse, onDone: () => void) {
  const { register, handleSubmit, formState } = useAppForm<DiscountValues>({
    resolver: zodResolver(discountSchema),
    defaultValues: { percent: '', reason: '' },
  })
  const discount = useOrderAction({
    mutationFn: (payload: DiscountRequest) => applyDiscount(order.id, payload),
    success: (updatedOrder) => `Descuento de ${formatPercent(updatedOrder.discount_percent)} aplicado.`,
    failure: 'No se pudo aplicar el descuento.',
    onSuccess: onDone,
  })
  const submit = handleSubmit((values) => {
    discount.mutate({ percent: decimalForApi(values.percent) ?? '0', reason: values.reason })
  })

  return { register, errors: formState.errors, discount, submit }
}
