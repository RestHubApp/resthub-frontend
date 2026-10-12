import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook } from '@testing-library/react'

import { useAppearance } from '@/store/appearance'
import { useQuickAppearance } from './useQuickAppearance'

afterEach(() => {
  useAppearance.getState().reset()
})

describe('useQuickAppearance', () => {
  it('cambia el modo y lo deja en las preferencias', () => {
    const { result } = renderHook(() => useQuickAppearance())

    act(() => {
      result.current.setMode('dark')
    })

    expect(result.current.mode).toBe('dark')
    expect(useAppearance.getState().appearance.mode).toBe('dark')
  })

  it('A+ y A− suben y bajan un paso, y se paran en los extremos', () => {
    const { result } = renderHook(() => useQuickAppearance())
    expect(result.current.canSmaller).toBe(false)

    act(() => {
      result.current.larger()
    })
    expect(result.current.textSize).toBe('large')
    expect(result.current.canSmaller).toBe(true)

    act(() => {
      result.current.setTextSize('largest')
    })
    expect(result.current.canLarger).toBe(false)
    act(() => {
      result.current.larger()
    })
    expect(result.current.textSize).toBe('largest')

    act(() => {
      result.current.smaller()
    })
    expect(result.current.textSize).toBe('larger')
  })

  it('el alto contraste se enciende y se apaga', () => {
    const { result } = renderHook(() => useQuickAppearance())

    act(() => {
      result.current.toggleHighContrast()
    })
    expect(result.current.isHighContrast).toBe(true)
    expect(document.documentElement).toHaveAttribute('data-theme', 'terracotta-contrast')

    act(() => {
      result.current.toggleHighContrast()
    })
    expect(result.current.isHighContrast).toBe(false)
    expect(document.documentElement).toHaveAttribute('data-theme', 'terracotta')
  })
})
