import { describe, expect, it, jest } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { member } from '#jest/fixtures/platform'
import { server } from '#jest/harness'
import { queryClient } from '@/services/queryClient'
import type { CreateStaffValues } from './staffSchema'
import { useCreateStaff } from './useCreateStaff'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

const INITIAL_SECRET = 'clave-segura-1'

const VALUES: CreateStaffValues = {
  full_name: 'María Rojas',
  email: 'maria@correo.com',
  role_id: '2',
  password: INITIAL_SECRET,
}

describe('useCreateStaff', () => {
  it('al crear la cuenta la pide al servidor y avisa que terminó', async () => {
    const api = server().on('post', '/staff', member({ id: 10 }))
    const onDone = jest.fn()
    const { result } = renderHook(() => useCreateStaff(onDone), { wrapper })

    act(() => {
      result.current.mutate(VALUES)
    })

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1)
    })
    expect(api.calls('post', '/staff')).toHaveLength(1)
  })
})
