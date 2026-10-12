import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { activityQueryKey } from '@/api/activity'
import { revealCustomer } from '@/api/customers'
import type { CustomerContact } from '@/api/types'

/**
 * «Ver completo» de un cliente. Lo revelado vive solo en este estado de la
 * ficha abierta: no se pone en el caché de consultas ni se guarda; al cerrar la
 * ficha se pierde.
 */
export function useRevealContact(customerId: number) {
  const queryClient = useQueryClient()
  const [contact, setContact] = useState<CustomerContact | null>(null)
  const reveal = useMutation({
    mutationFn: () => revealCustomer(customerId),
    gcTime: 0,
    onSuccess: (revealed) => {
      setContact(revealed)
      // Verlo completo queda en la bitácora: si está abierta, se vuelve a pedir.
      void queryClient.invalidateQueries({ queryKey: activityQueryKey })
    },
  })
  return { contact, reveal }
}
