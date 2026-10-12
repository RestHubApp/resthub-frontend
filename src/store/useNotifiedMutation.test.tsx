import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { ApiError } from '@/services/apiError'
import { useNotifications } from './notifications'
import { useNotifiedMutation } from './useNotifiedMutation'

const KEY = ['cosas'] as const

afterEach(() => {
  useNotifications.setState({ toasts: [] })
})

function setup(options: Partial<Parameters<typeof useNotifiedMutation<string, string>>[0]> = {}) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(KEY, ['viejo'])
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const view = renderHook(
    () => useNotifiedMutation<string, string>({ mutationFn: (value) => Promise.resolve(value), ...options }),
    { wrapper },
  )
  return { ...view, queryClient, invalidate }
}

const messages = () => useNotifications.getState().toasts.map((toast) => `${toast.tone}: ${toast.message}`)

describe('useNotifiedMutation', () => {
  it('al salir bien pone la respuesta en la caché, relee lo indicado y avisa', async () => {
    const onSuccess = jest.fn()
    const { result, queryClient, invalidate } = setup({
      success: (value) => `Listo ${value}`,
      updateCache: (client, value) => {
        client.setQueryData(KEY, [value])
      },
      invalidate: [KEY],
      onSuccess,
    })

    await act(async () => {
      await result.current.mutateAsync('nuevo')
    })

    expect(queryClient.getQueryData(KEY)).toEqual(['nuevo'])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: KEY })
    expect(messages()).toEqual(['info: Listo nuevo'])
    expect(onSuccess).toHaveBeenCalledWith('nuevo')
  })

  it('con shouldWait espera la relectura antes de avisar', async () => {
    const { result, invalidate } = setup({ success: () => 'Hecho', invalidate: [KEY], shouldWait: true })
    let release: () => void = () => undefined
    invalidate.mockReturnValueOnce(new Promise<void>((resolve) => { release = resolve }))

    act(() => {
      result.current.mutate('x')
    })
    await waitFor(() => { expect(invalidate).toHaveBeenCalled() })
    expect(messages()).toEqual([])
    await act(async () => {
      release()
      await Promise.resolve()
    })

    await waitFor(() => { expect(messages()).toEqual(['info: Hecho']) })
  })

  it('si falla avisa con lo que dijo el servidor, o con el texto de respaldo, y relee lo indicado', async () => {
    const detail = new ApiError({ method: 'POST', path: '/x', requestId: 'r1', status: 409, body: { detail: 'La mesa tiene un pedido.', code: 'conflict' } })
    const { result, invalidate } = setup({
      mutationFn: () => Promise.reject(detail),
      failure: 'No se pudo.',
      invalidateOnError: [KEY],
    })

    await act(async () => {
      await result.current.mutateAsync('x').catch(() => undefined)
    })

    expect(messages()).toEqual(['warning: La mesa tiene un pedido.'])
    expect(invalidate).toHaveBeenCalledWith({ queryKey: KEY })
  })

  it('sin texto de falla no avisa: el formulario muestra el error', async () => {
    const { result } = setup({ mutationFn: () => Promise.reject(new Error('boom')) })

    await act(async () => {
      await result.current.mutateAsync('x').catch(() => undefined)
    })

    expect(messages()).toEqual([])
  })
})
