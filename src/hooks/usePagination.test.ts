import { describe, expect, it } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { usePagination } from './usePagination'

const DIEZ = Array.from({ length: 10 }, (_, i) => i + 1)

describe('usePagination', () => {
  it('parte la lista en páginas del tamaño pedido', () => {
    const { result } = renderHook(() => usePagination(DIEZ, 4))
    expect(result.current.total).toBe(3)
    expect(result.current.visibles).toEqual([1, 2, 3, 4])

    act(() => {
      result.current.irA(2)
    })
    expect(result.current.actual).toBe(2)
    expect(result.current.visibles).toEqual([9, 10])
  })

  it('sin tamaño devuelve todo en una sola página, y una lista vacía también tiene una', () => {
    expect(renderHook(() => usePagination(DIEZ, undefined)).result.current.visibles).toHaveLength(10)
    const vacia = renderHook(() => usePagination([], 5)).result.current
    expect(vacia.total).toBe(1)
    expect(vacia.visibles).toEqual([])
  })

  it('si un filtro achica la lista, se queda en la última página que existe', () => {
    const { result, rerender } = renderHook(({ items }) => usePagination(items, 4), { initialProps: { items: DIEZ } })
    act(() => {
      result.current.irA(2)
    })

    rerender({ items: DIEZ.slice(0, 5) })

    expect(result.current.actual).toBe(1)
    expect(result.current.visibles).toEqual([5])
  })
})
