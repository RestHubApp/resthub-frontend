import { describe, expect, it } from '@jest/globals'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'

import { buildAccount, currentStaff, ErrorResponse, PERMISSIONS_OWNER, server, signInAs } from '#jest/harness'
import { queryClient } from '@/services/queryClient'
import { useAcceptTerms } from './useAcceptTerms'

const TERMS = '/auth/me/terms'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(QueryClientProvider, { client: queryClient }, children)
}

describe('useAcceptTerms', () => {
  it('al aceptar deja la cuenta con los términos aceptados', async () => {
    const accepted = buildAccount(PERMISSIONS_OWNER, { terms_accepted: true })
    server().on('post', TERMS, accepted)
    signInAs(PERMISSIONS_OWNER, { terms_accepted: false })
    const { result } = renderHook(() => useAcceptTerms('2026-01'), { wrapper })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => {
      expect(currentStaff()?.terms_accepted).toBe(true)
    })
  })

  it('si la versión cambió (409) relee la cuenta', async () => {
    const newer = buildAccount(PERMISSIONS_OWNER, { terms_accepted: false, terms_version: '2027-01' })
    server().on('post', TERMS, new ErrorResponse(409, 'Cambió', 'outdated_terms')).on('get', '/auth/me', newer)
    signInAs(PERMISSIONS_OWNER, { terms_accepted: false })
    const { result } = renderHook(() => useAcceptTerms('2026-01'), { wrapper })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => {
      expect(currentStaff()?.terms_version).toBe('2027-01')
    })
  })
})
