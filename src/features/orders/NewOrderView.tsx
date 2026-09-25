import { useSearchParams } from 'react-router'

import NewTableOrder from './taking/NewTableOrder'
import TakeOrder from './taking/TakeOrder'

/**
 * Un pedido nuevo: `?mesa=3` para una mesa, `?tipo=llevar&cliente=Ana` para llevar.
 */
export default function NewOrderView() {
  const [params] = useSearchParams()
  const tableId = Number(params.get('mesa'))

  if (Number.isInteger(tableId) && tableId > 0) {
    return <NewTableOrder key={tableId} tableId={tableId} />
  }
  const cliente = (params.get('cliente') ?? '').trim()
  return (
    <TakeOrder
      target={{ kind: 'takeaway', customerName: cliente }}
      title={cliente === '' ? 'Para llevar' : `Para llevar · ${cliente}`}
      description="Nuevo pedido. Toca los platos que pide el cliente."
    />
  )
}
