import { describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { classifyOrderNotes } from '@/api/insights'
import type { OrderNoteClassification } from '@/api/types'
import { useClassifyPendingNotes } from './useClassifyPendingNotes'

jest.mock('@/api/insights', () => ({
  classifyOrderNotes: jest.fn(() => Promise.resolve()),
  orderNotesQueryKey: ['order-notes'],
}))

const PENDING = { order_id: 1, order_item_id: null, status: 'pending' } as unknown as OrderNoteClassification

function wrapper({ children }: { readonly children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe('useClassifyPendingNotes', () => {
  it('pide clasificar una nota pendiente una sola vez', async () => {
    const { rerender } = renderHook(({ items }) => { useClassifyPendingNotes(items, true) }, {
      wrapper,
      initialProps: { items: [PENDING] },
    })
    await waitFor(() => { expect(classifyOrderNotes).toHaveBeenCalledTimes(1) })
    rerender({ items: [PENDING] })
    expect(classifyOrderNotes).toHaveBeenCalledTimes(1)
  })

  it('no pide nada si la pantalla no lo solicitó', () => {
    jest.mocked(classifyOrderNotes).mockClear()
    renderHook(() => { useClassifyPendingNotes([PENDING], false) }, { wrapper })
    expect(classifyOrderNotes).not.toHaveBeenCalled()
  })
})
