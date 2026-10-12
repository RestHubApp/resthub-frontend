import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'react-router'

import { orderQuery } from '@/api/orders'
import { EmptyState } from '@/components/EmptyState'
import { PrintSheet } from './PrintSheet'
import { RetryQueryError } from '@/components/RetryQueryError'

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
    return <RetryQueryError error={order.error} fallback="No se pudo cargar el pedido." onRetry={() => void order.refetch()} />
  }

  return <PrintSheet order={order.data} isTicket={params['kind'] === 'comanda'} />
}
