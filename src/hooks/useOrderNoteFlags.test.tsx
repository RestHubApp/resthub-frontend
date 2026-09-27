import { describe, expect, it } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { servidor } from '#jest/harness'
import type { OrderNoteClassification } from '../api/types'
import { queryClient } from '../services/queryClient'
import { useOrderNoteFlags, type OrderNoteFlagsOptions } from './useOrderNoteFlags'

const NOTAS = '/insights/order-notes'
const CLASIFICAR = '/insights/order-notes/classify'

function nota(cambios: Partial<OrderNoteClassification>): OrderNoteClassification {
  return {
    allergy_probability: null,
    confidence: null,
    decided_at: null,
    dish_name: 'Ceviche',
    engine: null,
    mentions_allergy: null,
    note: 'sin ají',
    note_type: null,
    note_type_label: null,
    order_id: 1,
    order_item_id: 10,
    scope: 'item',
    status: 'classified',
    ...cambios,
  }
}

function envoltorio({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

function marcas(ids: readonly number[], opciones: OrderNoteFlagsOptions = { live: false }) {
  return renderHook(() => useOrderNoteFlags(ids, opciones), { wrapper: envoltorio })
}

describe('useOrderNoteFlags', () => {
  it('encuentra la lectura de la nota de un plato y la del pedido entero', async () => {
    servidor().on('get', NOTAS, {
      items: [
        nota({ order_item_id: 10, mentions_allergy: true }),
        nota({ order_item_id: null, scope: 'order', note: 'mesa con niños' }),
      ],
    })
    const { result } = marcas([1])

    await waitFor(() => {
      expect(result.current.flags).toHaveLength(2)
    })
    expect(result.current.flagFor(1, 10)?.mentions_allergy).toBe(true)
    expect(result.current.flagFor(1, null)?.note).toBe('mesa con niños')
    expect(result.current.flagFor(1, 99)).toBeUndefined()
    expect(result.current.allergyCount).toBe(1)
  })

  it('pregunta una sola vez por cada pedido, ordenados y sin repetir', async () => {
    const api = servidor().on('get', NOTAS, { items: [] })
    const { result } = marcas([3, 1, 3, 2])

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(api.llamadas('get', NOTAS)[0]?.params).toEqual({ order_ids: [1, 2, 3] })
  })

  it('pide clasificar las notas pendientes una sola vez', async () => {
    const api = servidor()
      .on('get', NOTAS, { items: [nota({ status: 'pending' })] })
      .on('post', CLASIFICAR, null)
    marcas([1])

    await waitFor(() => {
      expect(api.llamadas('post', CLASIFICAR)).toHaveLength(1)
    })
    await waitFor(() => {
      expect(api.llamadas('get', NOTAS).length).toBeGreaterThanOrEqual(2)
    })
    expect(api.llamadas('post', CLASIFICAR)).toHaveLength(1)
  })

  it('sin permiso o sin pedidos no pregunta al servidor', () => {
    const api = servidor()
    const sinPermiso = marcas([1], { enabled: false, live: false }).result.current
    marcas([])
    expect(api.peticiones).toHaveLength(0)
    expect(sinPermiso.isLoading).toBe(false)
    expect(sinPermiso.flags).toEqual([])
  })
})
