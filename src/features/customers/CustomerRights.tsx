import { useMutation, useQueryClient } from '@tanstack/react-query'

import { anonymizeCustomer, customersQueryKey, exportCustomer } from '../../api/customers'
import type { Customer, CustomerExport } from '../../api/types'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormMessage from '../../components/FormMessage'
import { Button } from '../../components/ui/button'
import { errorMessage } from '../../services/api'
import { useNotifications } from '../../store/notifications'

/** Entrega el archivo al navegador, como cualquier descarga. */
function descargar(datos: CustomerExport, customerId: number): void {
  const archivo = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(archivo)
  enlace.download = `cliente-${String(customerId)}-datos.json`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

interface CustomerRightsProps {
  readonly customer: Customer
  /** Después de borrar, la ficha ya no existe: se cierra. */
  readonly onErased: () => void
}

/**
 * Derechos ARCO del cliente (Ley N.º 29733), para quien tiene `customers.erase`.
 *
 * Acceso: descargar lo que se guarda de él, completo. Cancelación: borrar sus datos
 * de la ficha, sus pedidos y sus reservas; no se deshace y los comprobantes se
 * conservan. La rectificación es «Editar datos».
 */
export default function CustomerRights({ customer, onErased }: CustomerRightsProps) {
  const queryClient = useQueryClient()
  const push = useNotifications((state) => state.push)
  const exportar = useMutation({
    mutationFn: () => exportCustomer(customer.id),
    onSuccess: (datos) => {
      descargar(datos, customer.id)
    },
  })
  const borrar = useMutation({
    mutationFn: () => anonymizeCustomer(customer.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customersQueryKey })
      push({ tone: 'info', message: 'Los datos del cliente se borraron.' })
      onErased()
    },
  })
  const fallo = exportar.error ?? borrar.error

  return (
    <section aria-labelledby="derechos-titulo" className="flex flex-col gap-2 border-t pt-4">
      <h3 id="derechos-titulo" className="m-0 text-sm font-semibold">Sus datos personales</h3>
      <p className="m-0 text-sm text-muted-foreground">
        Si el cliente lo pide, descarga lo que se guarda de él o bórralo (Ley N.º 29733).
      </p>
      {fallo === null ? null : <FormMessage tone="error">{errorMessage(fallo, 'No se pudo completar.')}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="h-11"
          disabled={exportar.isPending}
          onClick={() => {
            exportar.mutate()
          }}
        >
          {exportar.isPending ? 'Preparando…' : 'Descargar sus datos'}
        </Button>
        <ConfirmDialog
          trigger={
            <Button type="button" variant="destructive" size="lg" className="h-11" disabled={borrar.isPending}>
              Borrar sus datos
            </Button>
          }
          title={`¿Borrar los datos de ${customer.name}?`}
          description="Se borran su nombre, teléfono, correo, dirección y notas de la libreta, de sus pedidos y de sus reservas. Sus ventas siguen contando y los comprobantes se conservan, como pide la ley tributaria. No se puede deshacer."
          confirmLabel="Borrar sus datos"
          onConfirm={() => {
            borrar.mutate()
          }}
        />
      </div>
    </section>
  )
}
