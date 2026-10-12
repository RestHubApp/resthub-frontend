import { FormMessage } from '@/components/FormMessage'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { useOfflineOrders } from './useOfflineOrders'

/**
 * Cuántos pedidos esperan señal para enviarse, con un botón para reintentar ya.
 *
 * Montarlo es lo que dispara el envío automático al volver la conexión: va en
 * las pantallas donde el mesero pasa el turno.
 */
export function OfflineOrdersBanner() {
  const { pending, send } = useOfflineOrders()
  if (pending.length === 0) {
    return null
  }

  return (
    <FormMessage
      tone="warning"
      icon="offline"
      action={
        <Button type="button" size="sm" variant="outline" onClick={() => {
          void send()
        }}>
          <Icon name="retry" size={14} />
          <span>Reintentar</span>
        </Button>
      }
    >
      {pending.length === 1 ? '1 pedido espera señal' : `${String(pending.length)} pedidos esperan señal`}:{' '}
      {pending.map((order) => order.label).join(', ')}. Se envían solos al volver la conexión.
    </FormMessage>
  )
}
