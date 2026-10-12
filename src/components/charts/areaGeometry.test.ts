import { describe, expect, it } from '@jest/globals'

import { areaGeometry } from './areaGeometry'

const POINTS = [
  { key: 'a', axisLabel: 'a', value: 10 },
  { key: 'b', axisLabel: 'b', value: 40 },
]

describe('areaGeometry', () => {
  it('sin serie superpuesta no dibuja su línea', () => {
    expect(areaGeometry(POINTS, { width: 400, height: 260 }).overlayPath).toBe('')
  })

  it('el tope del eje cubre también a la serie superpuesta', () => {
    expect(areaGeometry(POINTS, { width: 400, height: 260 }).ticks.at(-1)).toBe(40)
    const geometry = areaGeometry(POINTS, { width: 400, height: 260 }, [5, 90])
    expect(geometry.ticks.at(-1)).toBe(100)
    expect(geometry.overlayPath.startsWith('M')).toBe(true)
  })
})
