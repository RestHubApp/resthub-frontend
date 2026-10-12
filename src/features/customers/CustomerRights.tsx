import type { Customer } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FormMessage } from '@/components/FormMessage'
import { Button } from '@/components/ui/button'
import { errorMessage } from '@/services/apiError'
import { useCustomerRights } from './useCustomerRights'

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
export function CustomerRights({ customer, onErased }: CustomerRightsProps) {
  const { exportAction, remove } = useCustomerRights(customer.id, onErased)
  const failure = exportAction.error ?? remove.error

  return (
    <section aria-labelledby="derechos-titulo" className="flex flex-col gap-2 border-t pt-4">
      <h3 id="derechos-titulo" className="m-0 text-sm font-semibold">Sus datos personales</h3>
      <p className="m-0 text-sm text-muted-foreground">
        Si el cliente lo pide, descarga lo que se guarda de él o bórralo (Ley N.º 29733).
      </p>
      {failure === null ? null : <FormMessage tone="error">{errorMessage(failure, 'No se pudo completar.')}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={exportAction.isPending}
          onClick={() => {
            exportAction.mutate()
          }}
        >
          {exportAction.isPending ? 'Preparando…' : 'Descargar sus datos'}
        </Button>
        <ConfirmDialog
          trigger={
            <Button type="button" variant="destructive" disabled={remove.isPending}>
              Borrar sus datos
            </Button>
          }
          title={`¿Borrar los datos de ${customer.name}?`}
          description="Se borran su nombre, teléfono, correo, dirección y notas de la libreta, de sus pedidos y de sus reservas. Sus ventas siguen contando y los comprobantes se conservan, como pide la ley tributaria. No se puede deshacer."
          confirmLabel="Borrar sus datos"
          onConfirm={() => {
            remove.mutate()
          }}
        />
      </div>
    </section>
  )
}
