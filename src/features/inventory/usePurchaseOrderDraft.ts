import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { ingredientsQuery } from '@/api/inventory'
import { createPurchaseOrder, purchaseSuggestionsQuery, suppliersQuery } from '@/api/purchasing'
import type { CreatePurchaseOrderRequest } from '@/api/types'
import { formatMoney } from '@/services/format'
import { emptyLine, type LineDraft, linesForApi, linesFromSuggestions } from './purchaseLines'
import { usePurchasingMutation } from './usePurchasingMutation'

const NO_ITEMS: readonly never[] = []

/**
 * El borrador de una orden de compra: proveedor, líneas y su creación.
 *
 * Solo consulta proveedores, insumos y sugerencias mientras la ventana está
 * abierta. Cerrar descarta el borrador.
 */
export function usePurchaseOrderDraft(open: boolean, onClose: () => void) {
  const suppliers = useQuery({ ...suppliersQuery, enabled: open })
  const ingredients = useQuery({ ...ingredientsQuery, enabled: open })
  const suggestions = useQuery({ ...purchaseSuggestionsQuery, enabled: open })
  const [supplier, setSupplier] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()])
  const close = () => {
    setSupplier('')
    setLines([emptyLine()])
    onClose()
  }
  const create = usePurchasingMutation({
    mutationFn: (payload: CreatePurchaseOrderRequest) => createPurchaseOrder(payload),
    success: (order) => `Orden de compra ${String(order.number)} creada (${formatMoney(order.estimated_total)}).`,
    failure: 'No se pudo crear la orden.',
    onSuccess: close,
  })
  const suggested = suggestions.data ?? NO_ITEMS
  const apiLines = linesForApi(lines)

  return {
    suppliers: (suppliers.data ?? NO_ITEMS).filter((item) => item.is_active),
    ingredients: ingredients.data ?? NO_ITEMS,
    suggestionCount: suggested.length,
    supplier,
    setSupplier,
    lines,
    setLines,
    close,
    isCreating: create.isPending,
    canCreate: supplier !== '' && apiLines !== null && !create.isPending,
    loadSuggestions: () => {
      setLines(linesFromSuggestions(suggestions.data ?? NO_ITEMS))
    },
    submit: () => {
      if (apiLines !== null) {
        create.mutate({ supplier_id: Number(supplier), lines: apiLines, notes: '' })
      }
    },
  }
}
