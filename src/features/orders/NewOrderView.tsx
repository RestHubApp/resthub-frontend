import { useSearchParams } from 'react-router'

import NewTableOrder from './taking/NewTableOrder'
import type { OrderTarget } from './taking/orderTarget'
import TakeOrder from './taking/TakeOrder'

type AwayTarget = Extract<OrderTarget, { kind: 'takeaway' }>

/** Lee de la URL a quién va un pedido para llevar o delivery. */
function awayTarget(params: URLSearchParams): AwayTarget {
  const texto = (clave: string) => (params.get(clave) ?? '').trim()
  const customerId = Number(params.get('clienteId'))
  const base = {
    kind: 'takeaway' as const,
    customerName: texto('cliente'),
    ...(Number.isInteger(customerId) && customerId > 0 ? { customerId } : {}),
  }
  if (params.get('tipo') !== 'delivery') {
    return base
  }
  return {
    ...base,
    delivery: { phone: texto('telefono'), address: texto('direccion'), reference: texto('referencia') },
  }
}

function awayTitle(target: AwayTarget): string {
  const tipo = target.delivery === undefined ? 'Para llevar' : 'Delivery'
  return target.customerName === '' ? tipo : `${tipo} · ${target.customerName}`
}

/**
 * Un pedido nuevo: `?mesa=3` para una mesa, `?tipo=llevar&cliente=Ana` para
 * llevar, `?tipo=delivery&cliente=Ana&telefono=…&direccion=…` para delivery.
 */
export default function NewOrderView() {
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
