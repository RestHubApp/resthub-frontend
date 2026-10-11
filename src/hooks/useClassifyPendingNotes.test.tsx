import { beforeEach, describe, expect, it } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'

import { mswServer } from '#jest/mswServer'

import type { OrderNoteClassification } from '@/api/types'
import { useClassifyPendingNotes } from './useClassifyPendingNotes'

let classifications = 0

beforeEach(() => {
  classifications = 0
  mswServer.use(
    http.post('*/api/v1/insights/order-notes/classify', () => {
      classifications += 1
      return new HttpResponse(null, { status: 204 })
    }),
  )
})

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
    await waitFor(() => { expect(classifications).toBe(1) })
    rerender({ items: [PENDING] })
    expect(classifications).toBe(1)
  })

  it('no pide nada si la pantalla no lo solicitó', () => {
    renderHook(() => { useClassifyPendingNotes([PENDING], false) }, { wrapper })
    expect(classifications).toBe(0)
  })
})
