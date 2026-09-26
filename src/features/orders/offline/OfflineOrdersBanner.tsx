import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'
import { useOfflineOrders } from './useOfflineOrders'

/**
 * Cuántos pedidos esperan señal para enviarse, con un botón para reintentar ya.
 *
 * Montarlo es lo que dispara el envío automático al volver la conexión: va en
 * las pantallas donde el mesero pasa el turno.
 */
export default function OfflineOrdersBanner() {
  const { pendientes, enviar } = useOfflineOrders()
  if (pendientes.length === 0) {
    return null
  }

  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning">
      <span className="flex items-center gap-2">
        <Icon name="sinConexion" size={18} />
        <span>
          {pendientes.length === 1 ? '1 pedido espera señal' : `${String(pendientes.length)} pedidos esperan señal`}:{' '}
          {pendientes.map((pedido) => pedido.label).join(', ')}. Se envían solos al volver la conexión.
        </span>
      </span>
      <Button type="button" size="sm" variant="outline" onClick={() => {
        void enviar()
      }}>
        <Icon name="reintentar" size={14} />
        <span>Reintentar</span>
      </Button>
    </div>
  )
}
