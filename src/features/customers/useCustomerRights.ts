import { useMutation, useQueryClient } from '@tanstack/react-query'

import { anonymizeCustomer, customersQueryKey, exportCustomer } from '@/api/customers'
import type { CustomerExport } from '@/api/types'
import { saveFile } from '@/services/download'
import { useNotifications } from '@/store/notifications'

/** Entrega el archivo al navegador, como cualquier descarga. */
function download(data: CustomerExport, customerId: number): void {
  saveFile(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `cliente-${String(customerId)}-datos.json`)
}

/**
 * Las dos mutaciones de los derechos ARCO de un cliente: descargar sus datos
 * y borrarlos. Al borrar refresca la libreta, avisa y llama a `onErased`.
 */
export function useCustomerRights(customerId: number, onErased: () => void) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const exportAction = useMutation({
    mutationFn: () => exportCustomer(customerId),
    onSuccess: (data) => {
      download(data, customerId)
    },
  })
  const remove = useMutation({
    mutationFn: () => anonymizeCustomer(customerId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customersQueryKey })
      push({ tone: 'info', message: 'Los datos del cliente se borraron.' })
      onErased()
    },
  })
  return { exportAction, remove }
}
