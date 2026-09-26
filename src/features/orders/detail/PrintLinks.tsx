import { Link } from 'react-router'

import type { OrderResponse } from '../../../api/types'
import Icon from '../../../components/Icon'
import { Button } from '../../../components/ui/button'

interface PrintLinksProps {
  readonly order: OrderResponse
}

/**
 * Imprimir la comanda para la cocina y la cuenta para el cliente.
 *
 * La comanda tiene sentido desde que el pedido va a cocina; la cuenta, en
 * cualquier momento (antes de pagar es la precuenta, después el ticket).
 */
export default function PrintLinks({ order }: PrintLinksProps) {
  const base = `/imprimir/${String(order.id)}`
  const enCocina = order.status !== 'open' && order.status !== 'cancelled'

  return (
    <div className="flex flex-wrap gap-2">
      {enCocina ? (
        <Button asChild variant="ghost" size="sm">
          <Link to={`${base}/comanda`}>
            <Icon name="imprimir" size={16} />
            <span>Imprimir comanda</span>
          </Link>
        </Button>
      ) : null}
      {order.status === 'cancelled' ? null : (
        <Button asChild variant="ghost" size="sm">
          <Link to={`${base}/cuenta`}>
            <Icon name="imprimir" size={16} />
            <span>{order.status === 'paid' ? 'Imprimir ticket' : 'Imprimir precuenta'}</span>
          </Link>
        </Button>
      )}
    </div>
  )
}
