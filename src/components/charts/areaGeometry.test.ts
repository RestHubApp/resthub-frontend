import { describe, expect, it } from '@jest/globals'

import { areaGeometry } from './areaGeometry'

const PUNTOS = [
  { key: 'a', axisLabel: 'a', value: 10 },
  { key: 'b', axisLabel: 'b', value: 40 },
]

describe('areaGeometry', () => {
  it('sin serie superpuesta no dibuja su línea', () => {
    expect(areaGeometry(PUNTOS, 400, 260).overlayPath).toBe('')
  })

  it('el tope del eje cubre también a la serie superpuesta', () => {
    expect(areaGeometry(PUNTOS, 400, 260).ticks.at(-1)).toBe(40)
    const geometria = areaGeometry(PUNTOS, 400, 260, [5, 90])
    expect(geometria.ticks.at(-1)).toBe(100)
    expect(geometria.overlayPath.startsWith('M')).toBe(true)
  })
})
