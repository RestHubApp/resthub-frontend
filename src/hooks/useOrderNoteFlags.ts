import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { classifyOrderNotes, MAX_ORDER_NOTES_ORDERS, orderNotesQuery, orderNotesQueryKey } from '@/api/insights'
import type { OrderNoteClassification } from '@/api/types'
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
  const active = enabled && ids.length > 0

  const notes = useQuery({
    ...orderNotesQuery(ids),
    enabled: active,
    // Al llegar un pedido nuevo cambia la lista de ids: los distintivos de los
    // que ya estaban siguen a la vista mientras se pregunta por la lista nueva.
    placeholderData: keepPreviousData,
  })

  useServerEvent('insights', () => {
    void queryClient.invalidateQueries({ queryKey: orderNotesQueryKey })
  }, active && live)

  const { mutate: classify, isPending: classifying } = useMutation({
    mutationFn: classifyOrderNotes,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderNotesQueryKey }),
  })
  const ordered = useRef(new Set<string>())
  const data = notes.data
  // Lo que se conserva de la consulta anterior puede traer pedidos que ya no están.
  const items = useMemo(() => {
    const current = new Set(ids)
    return data?.items.filter((item) => current.has(item.order_id))
  }, [data, ids])
  // Lo pendiente de clasificar; vacio si la pantalla no lo pidio.
  const pending = useMemo(
    () =>
      classifyPending
        ? (items ?? []).filter((item) => item.status === 'pending').map((item) => keyOf(item.order_id, item.order_item_id))
        : [],
    [items, classifyPending],
  )
  useEffect(() => {
    const fresh = pending.filter((password) => !ordered.current.has(password))
    if (fresh.length === 0 || classifying) {
      return
    }
    for (const password of fresh) {
      ordered.current.add(password)
    }
    classify()
  }, [pending, classify, classifying])

  return useMemo(() => {
    const list = items ?? []
    const byPassword = new Map(list.map((item) => [keyOf(item.order_id, item.order_item_id), item]))
    return {
      flags: list,
      flagFor: (orderId, orderItemId) => byPassword.get(keyOf(orderId, orderItemId)),
      allergyCount: list.filter((item) => item.mentions_allergy === true).length,
      isLoading: notes.isPending && active,
      error: notes.error,
    }
  }, [items, notes.isPending, notes.error, active])
}
