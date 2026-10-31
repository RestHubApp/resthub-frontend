import { zodResolver } from '@hookform/resolvers/zod'

import { useAppForm } from '@/hooks/useAppForm'
import { type VoidItemValues, voidItemSchema } from './voidItemSchema'

/** El formulario del motivo de una anulación (de un plato o de un cobro), vacío al abrirse. */
export function useVoidReasonForm() {
  return useAppForm<VoidItemValues>({
    resolver: zodResolver(voidItemSchema),
    defaultValues: { reason: '' },
  })
}
