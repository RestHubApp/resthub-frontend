import { describe, expect, it, jest } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { server } from '#jest/harness'
import { queryClient } from '@/services/queryClient'
import { useCustomerRights } from './useCustomerRights'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useCustomerRights', () => {
  it('al borrar los datos pide la anonimización y avisa que terminó', async () => {
    const api = server().on('post', '/customers/5/anonymize', null)
    const onErased = jest.fn()
    const { result } = renderHook(() => useCustomerRights(5, onErased), { wrapper })

    act(() => {
      result.current.remove.mutate()
    })

    await waitFor(() => {
      expect(onErased).toHaveBeenCalledTimes(1)
    })
    expect(api.calls('post', '/customers/5/anonymize')).toHaveLength(1)
  })

  it('al descargar pide el export del cliente', async () => {
    const api = server().on('get', '/customers/5/export', { id: 5 })
    URL.createObjectURL = jest.fn(() => 'blob:x')
    URL.revokeObjectURL = jest.fn()
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const { result } = renderHook(() => useCustomerRights(5, jest.fn()), { wrapper })

    act(() => {
      result.current.exportAction.mutate()
    })

    await waitFor(() => {
      expect(result.current.exportAction.isSuccess).toBe(true)
    })
    expect(api.calls('get', '/customers/5/export')).toHaveLength(1)
  })
})
