import { describe, expect, it } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { useModifierGroups } from './useModifierGroups'

describe('useModifierGroups', () => {
  it('sin grupos devuelve una lista vacía y sin error', () => {
    const { result } = renderHook(() => useModifierGroups(undefined))

    let collected: unknown
    act(() => {
      collected = result.current.collect()
    })

    expect(collected).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('con un grupo sin nombre deja el motivo y devuelve null', () => {
    const { result } = renderHook(() => useModifierGroups(undefined))
    act(() => {
      result.current.setGroups([{ name: '', max: '1', required: false, options: 'Personal' }])
    })

    let collected: unknown
    act(() => {
      collected = result.current.collect()
    })

    expect(collected).toBeNull()
    expect(result.current.error).not.toBeNull()
  })
})
