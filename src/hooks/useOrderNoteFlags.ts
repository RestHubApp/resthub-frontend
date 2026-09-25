import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { classifyOrderNotes, fetchOrderNotes, MAX_ORDER_NOTES_ORDERS, orderNotesQueryKey } from '../api/insights'
import type { OrderNoteClassification } from '../api/types'
import { useServerEvent } from './useServerEvent'

/** Cómo leyó la IA una nota: de un plato (`order_item_id`) o del pedido entero (`null`). */
export type OrderNoteFlag = OrderNoteClassification

export interface OrderNoteFlagsOptions {
  /** Sin permiso `insights.read` no hay que preguntar: el servidor respondería 403. */
  readonly enabled?: boolean
  /**
   * Abre su propia escucha del evento SSE `insights`. Si la pantalla ya
   * escucha el canal y, ante `insights`, invalida `orderNotesQueryKey`, se
   * pasa `false` para no abrir una segunda conexión.
   */
  readonly live?: boolean
  /** Pide clasificar las notas que siguen pendientes (una vez por nota). */
  readonly classifyPending?: boolean
}

export interface OrderNoteFlags {
  readonly flags: readonly OrderNoteFlag[]
  /** La lectura de la nota de un plato, o la del pedido con `orderItemId = null`. */
  readonly flagFor: (orderId: number, orderItemId: number | null) => OrderNoteFlag | undefined
  /** Notas que la IA marcó como alergia o restricción. */
  readonly allergyCount: number
  readonly isLoading: boolean
  readonly error: unknown
}

function keyOf(orderId: number, orderItemId: number | null): string {
  return `${String(orderId)}:${orderItemId === null ? 'pedido' : String(orderItemId)}`
}

/**
 * Las alergias y restricciones que la IA encontró en las notas de unos
 * pedidos (`GET /insights/order-notes`), al día con el evento SSE `insights`.
 *
 * Pensado para el tablero de cocina: se le pasan los pedidos en pantalla y
 * cada ítem pregunta `flagFor(pedido, ítem)` para decidir si lleva el
 * distintivo de alergia.
 */
export function useOrderNoteFlags(orderIds: readonly number[], options: OrderNoteFlagsOptions = {}): OrderNoteFlags {
  const { enabled = true, live = true, classifyPending = true } = options
  const queryClient = useQueryClient()
  const ids = useMemo(() => [...new Set(orderIds)].sort((a, b) => a - b).slice(0, MAX_ORDER_NOTES_ORDERS), [orderIds])
  const activo = enabled && ids.length > 0

  const notas = useQuery({
    queryKey: [...orderNotesQueryKey, ids],
    queryFn: () => fetchOrderNotes(ids),
    enabled: activo,
  })

  useServerEvent('insights', () => {
    void queryClient.invalidateQueries({ queryKey: orderNotesQueryKey })
  }, activo && live)

  const clasificar = useMutation({
    mutationFn: classifyOrderNotes,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderNotesQueryKey }),
  })
  const pedidas = useRef(new Set<string>())
  const items = notas.data?.items
  useEffect(() => {
    const nuevas = (items ?? [])
      .filter((item) => item.status === 'pending')
      .map((item) => keyOf(item.order_id, item.order_item_id))
      .filter((clave) => !pedidas.current.has(clave))
    if (!classifyPending || nuevas.length === 0 || clasificar.isPending) {
      return
    }
    for (const clave of nuevas) {
      pedidas.current.add(clave)
    }
    clasificar.mutate()
  }, [items, classifyPending, clasificar])

  return useMemo(() => {
    const lista = items ?? []
    const porClave = new Map(lista.map((item) => [keyOf(item.order_id, item.order_item_id), item]))
    return {
      flags: lista,
      flagFor: (orderId, orderItemId) => porClave.get(keyOf(orderId, orderItemId)),
      allergyCount: lista.filter((item) => item.mentions_allergy === true).length,
      isLoading: notas.isPending && activo,
      error: notas.error,
    }
  }, [items, notas.isPending, notas.error, activo])
}
