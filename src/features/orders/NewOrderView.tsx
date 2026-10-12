import { useSearchParams } from 'react-router'

import { NewTableOrder } from './taking/NewTableOrder'
import type { OrderTarget } from './taking/orderTarget'
import { TakeOrder } from './taking/TakeOrder'

type AwayTarget = Extract<OrderTarget, { kind: 'takeaway' }>

/** Lee de la URL a quién va un pedido para llevar o delivery. */
function awayTarget(params: URLSearchParams): AwayTarget {
  const text = (key: string) => (params.get(key) ?? '').trim()
  const customerId = Number(params.get('clienteId'))
  const base = {
    kind: 'takeaway' as const,
    customerName: text('cliente'),
    ...(Number.isInteger(customerId) && customerId > 0 ? { customerId } : {}),
  }
  if (params.get('tipo') !== 'delivery') {
    return base
  }
  return {
    ...base,
    delivery: { phone: text('telefono'), address: text('direccion'), reference: text('referencia') },
  }
}

function awayTitle(target: AwayTarget): string {
  const type = target.delivery === undefined ? 'Para llevar' : 'Delivery'
  return target.customerName === '' ? type : `${type} · ${target.customerName}`
}

/**
 * Un pedido nuevo: `?mesa=3` para una mesa, `?tipo=llevar&cliente=Ana` para
 * llevar, `?tipo=delivery&cliente=Ana&telefono=…&direccion=…` para delivery.
 */
export function NewOrderView() {
  const [params] = useSearchParams()
  const tableId = Number(params.get('mesa'))

  if (Number.isInteger(tableId) && tableId > 0) {
    return <NewTableOrder key={tableId} tableId={tableId} />
  }
  const target = awayTarget(params)
  const description =
    target.delivery === undefined
      ? 'Nuevo pedido. Toca los platos que pide el cliente.'
      : `Nuevo delivery a ${target.delivery.address}. Toca los platos que pide el cliente.`
  return <TakeOrder target={target} title={awayTitle(target)} description={description} />
}
