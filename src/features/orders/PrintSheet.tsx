import type { OrderResponse } from '@/api/types'
import { BackLink } from '@/components/BackLink'
import { Icon } from '@/components/Icon'
import { PRINT_CSS } from '@/components/printSheet'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useSession, useTimeZone } from '@/store/session'
import { BillTicket } from './print/BillTicket'
import { KitchenTicket } from './print/KitchenTicket'

interface PrintSheetProps {
  readonly order: OrderResponse
  /** `true` para la comanda de cocina; `false` para la precuenta. */
  readonly isTicket: boolean
}

/** La hoja de 80 mm lista para imprimir, con su titulo para lector de pantalla y el boton de imprimir. */
export function PrintSheet({ order, isTicket }: PrintSheetProps) {
  const timeZone = useTimeZone()
  const restaurant = useSession((state) => state.account?.restaurant.name ?? '')

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{PRINT_CSS}</style>
      {/* La hoja no lleva título visible; el lector de pantalla sí lo necesita. */}
      <h1 className="sr-only">{`${isTicket ? 'Comanda' : 'Precuenta'} del pedido #${String(order.number)}`}</h1>
      <div className="flex w-full max-w-sm items-center justify-between gap-2 print:hidden">
        <BackLink to={paths.orders.detail(order.id)} label="Pedido" />
        <Button type="button" onClick={() => {
          window.print()
        }}>
          <Icon name="send" size={16} />
          <span>Imprimir</span>
        </Button>
      </div>
      <article id="hoja-impresa" className="w-[74mm] bg-white p-3 font-mono text-black shadow-md">
        {isTicket ? (
          <KitchenTicket order={order} timeZone={timeZone} />
        ) : (
          <BillTicket order={order} restaurant={restaurant} timeZone={timeZone} />
        )}
      </article>
    </div>
  )
}
