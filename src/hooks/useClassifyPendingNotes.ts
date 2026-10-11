import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef } from 'react'

import { classifyOrderNotes, orderNotesQueryKey } from '@/api/insights'
import type { OrderNoteClassification } from '@/api/types'
import { noteKeyOf } from './orderNoteKey'

/**
 * Pide clasificar las notas que siguen pendientes, una sola vez por nota, y
 * relee las lecturas de la IA cuando termina. Sin `isEnabled` no pide nada.
 */
export function useClassifyPendingNotes(items: readonly OrderNoteClassification[] | undefined, isEnabled: boolean): void {
  const queryClient = useQueryClient()
  const { mutate: classify, isPending: isClassifying } = useMutation({
    mutationFn: classifyOrderNotes,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orderNotesQueryKey }),
  })
  const ordered = useRef(new Set<string>())
  // Lo pendiente de clasificar; vacio si la pantalla no lo pidio.
  const pending = useMemo(
    () =>
      isEnabled
        ? (items ?? []).filter((item) => item.status === 'pending').map((item) => noteKeyOf(item.order_id, item.order_item_id))
        : [],
    [items, isEnabled],
  )
  useEffect(() => {
    const fresh = pending.filter((key) => !ordered.current.has(key))
    if (fresh.length === 0 || isClassifying) {
      return
    }
    for (const key of fresh) {
      ordered.current.add(key)
    }
    classify()
  }, [pending, classify, isClassifying])
}
