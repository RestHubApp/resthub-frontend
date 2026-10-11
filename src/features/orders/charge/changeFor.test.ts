import { describe, expect, it } from '@jest/globals'

import { changeFor } from './changeFor'

describe('changeFor', () => {
  it('sin monto escrito se cobra exacto: vuelto cero', () => {
    expect(changeFor(1000, '  ')).toBe(0)
  })

  it('devuelve la diferencia cuando alcanza', () => {
    expect(changeFor(1000, '20')).toBe(1000)
  })

  it('no hay vuelto si no alcanza o el monto no se entiende', () => {
    expect(changeFor(1000, '5')).toBeNull()
    expect(changeFor(1000, 'abc')).toBeNull()
  })
})
