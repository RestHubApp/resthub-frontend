import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { orderQuery } from '@/api/orders'
import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/Icon'
import { Button } from '@/components/ui/button'
import { paths } from '@/services/paths'
import { useSession, useTimeZone } from '@/store/session'
import { BackLink } from '@/components/BackLink'
import { BillTicket } from './print/BillTicket'
import { KitchenTicket } from './print/KitchenTicket'
import { PRINT_CSS } from '@/components/printSheet'
import { QueryError } from './QueryError'

/**
 * Una hoja para la impresora térmica: la comanda para cocina o la cuenta.
 *
 * Se imprime con el diálogo del navegador; la hoja ya viene con el ancho de
 * 80 mm. Al abrirla se lanza sola la impresión, y el botón queda por si se
 * cancela o hace falta otra copia.
 */
export function PrintView() {
  const params = useParams()
  const orderId = Number(params['orderId'])
  const isTicket = params['kind'] === 'comanda'
  const timeZone = useTimeZone()
  const restaurant = useSession((state) => state.account?.restaurant.name ?? '')
  const order = useQuery({ ...orderQuery(orderId), enabled: Number.isInteger(orderId) })
  const isReady = order.isSuccess

  useEffect(() => {
    if (isReady) {
      window.print()
    }
  }, [isReady])

  if (order.isPending) {
    return <EmptyState title="Preparando la hoja…" />
  }
  if (order.isError) {
    return <QueryError error={order.error} fallback="No se pudo cargar el pedido." onRetry={() => void order.refetch()} />
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{PRINT_CSS}</style>
      {/* La hoja no lleva título visible; el lector de pantalla sí lo necesita. */}
      <h1 className="sr-only">{`${isTicket ? 'Comanda' : 'Precuenta'} del pedido #${String(order.data.number)}`}</h1>
      <div className="flex w-full max-w-sm items-center justify-between gap-2 print:hidden">
        <BackLink to={paths.orders.detail(orderId)} label="Pedido" />
        <Button type="button" onClick={() => {
          window.print()
        }}>
          <Icon name="send" size={16} />
          <span>Imprimir</span>
        </Button>
      </div>
      <article id="hoja-impresa" className="w-[74mm] bg-white p-3 font-mono text-black shadow-md">
        {isTicket ? (
          <KitchenTicket order={order.data} timeZone={timeZone} />
        ) : (
          <BillTicket order={order.data} restaurant={restaurant} timeZone={timeZone} />
        )}
      </article>
    </div>
  )
}
