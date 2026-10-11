import { Link } from 'react-router'

import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'

interface PrintLinksProps {
  readonly order: OrderResponse
}

/**
 * Imprimir la comanda para la cocina y la cuenta para el cliente.
 *
 * La comanda tiene sentido desde que el pedido va a cocina; la cuenta, en
 * cualquier momento (antes de pagar es la precuenta, después el ticket).
 */
export function PrintLinks({ order }: PrintLinksProps) {
  const isInKitchen = order.status !== 'open' && order.status !== 'cancelled'

  return (
    <div className="flex flex-wrap gap-2">
      {isInKitchen ? (
        <Button asChild variant="ghost" size="sm">
          <Link to={paths.orders.print(order.id, 'comanda')}>
            <Icon name="print" size={16} />
            <span>Imprimir comanda</span>
          </Link>
        </Button>
      ) : null}
      {order.status === 'cancelled' ? null : (
        <Button asChild variant="ghost" size="sm">
          <Link to={paths.orders.print(order.id, 'cuenta')}>
            <Icon name="print" size={16} />
            <span>{order.status === 'paid' ? 'Imprimir ticket' : 'Imprimir precuenta'}</span>
          </Link>
        </Button>
      )}
    </div>
  )
}
