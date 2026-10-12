import { describe, expect, it, jest } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { server } from '#jest/harness'
import { queryClient } from '@/services/queryClient'
import { useTableSave } from './useTableSave'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useTableSave', () => {
  it('sin mesa crea una nueva y avisa al terminar', async () => {
    const api = server().on('post', '/tables', { id: 9, label: '9', is_active: true })
    const onSaved = jest.fn()
    const { result } = renderHook(() => useTableSave(null, onSaved), { wrapper })

    act(() => {
      result.current.mutate({ label: '9' })
    })

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1)
    })
    expect(api.calls('post', '/tables')).toHaveLength(1)
  })
})
