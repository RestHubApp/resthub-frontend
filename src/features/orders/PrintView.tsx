import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { fetchOrder, orderQueryKey } from '../../api/orders'
import EmptyState from '../../components/EmptyState'
import Icon from '../../components/Icon'
import { Button } from '../../components/ui/button'
import { useSession, useTimeZone } from '../../store/session'
import BackLink from './BackLink'
import BillTicket from './print/BillTicket'
import KitchenTicket from './print/KitchenTicket'
import { PRINT_CSS } from '../../components/printSheet'
import QueryError from './QueryError'

/**
 * Una hoja para la impresora térmica: la comanda para cocina o la cuenta.
 *
 * Se imprime con el diálogo del navegador; la hoja ya viene con el ancho de
 * 80 mm. Al abrirla se lanza sola la impresión, y el botón queda por si se
 * cancela o hace falta otra copia.
 */
export default function PrintView() {
  const params = useParams()
  const orderId = Number(params.orderId)
  const comanda = params.kind === 'comanda'
  const timeZone = useTimeZone()
  const restaurante = useSession((state) => state.account?.restaurant.name ?? '')
  const pedido = useQuery({
    queryKey: orderQueryKey(orderId),
    queryFn: () => fetchOrder(orderId),
    enabled: Number.isInteger(orderId),
  })
  const listo = pedido.isSuccess

  useEffect(() => {
    if (listo) {
      window.print()
    }
  }, [listo])

  if (pedido.isPending) {
    return <EmptyState title="Preparando la hoja…" />
  }
  if (pedido.isError) {
    return <QueryError error={pedido.error} fallback="No se pudo cargar el pedido." onRetry={() => void pedido.refetch()} />
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <style>{PRINT_CSS}</style>
      <div className="flex w-full max-w-sm items-center justify-between gap-2 print:hidden">
        <BackLink to={`/pedidos/${String(orderId)}`} label="Pedido" />
        <Button type="button" onClick={() => {
          window.print()
        }}>
          <Icon name="enviar" size={16} />
          <span>Imprimir</span>
        </Button>
      </div>
      <article id="hoja-impresa" className="w-[74mm] bg-white p-3 font-mono text-black shadow-md">
        {comanda ? (
          <KitchenTicket order={pedido.data} timeZone={timeZone} />
        ) : (
          <BillTicket order={pedido.data} restaurant={restaurante} timeZone={timeZone} />
        )}
      </article>
    </div>
  )
}
