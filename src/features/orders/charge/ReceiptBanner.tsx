import type { OrderResponse } from '@/api/types'
import { Icon } from '@/components/Icon'
import * as icons from '@/components/icons'
import { formatMoney } from '@/services/format'

interface ReceiptBannerProps {
  readonly order: OrderResponse
  /** El vuelto del último pago, o `null` si no hubo efectivo. */
  readonly change: string | null
}

/** El aviso de pedido pagado, con el vuelto grande o, sin vuelto, el total. */
export function ReceiptBanner({ order, change }: ReceiptBannerProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 rounded-xl bg-success/10 px-4 py-5 text-center text-success">
      <Icon glyph={icons.ready} size={32} />
      <p className="m-0 font-semibold">
        Pedido #{order.number} pagado · {order.payment_method_label ?? 'el medio elegido'}
      </p>
      {change === null ? (
        <p className="m-0 text-2xl font-bold tabular-nums">{formatMoney(order.total)}</p>
      ) : (
        <p className="m-0 flex flex-col">
          <span className="text-sm font-medium">Vuelto</span>
          <span className="text-4xl font-bold tabular-nums">{formatMoney(change)}</span>
        </p>
      )}
    </div>
  )
}
