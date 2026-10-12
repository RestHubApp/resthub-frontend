import { describe, expect, it } from '@jest/globals'

import { KIND_OPTIONS, KIND_TONES } from './movementKinds'

describe('movementKinds', () => {
  it('contiene las cuatro opciones en orden con sus etiquetas', () => {
    expect(KIND_OPTIONS.map((o) => o.value)).toEqual(['purchase', 'consumption', 'waste', 'adjustment'])
    expect(KIND_OPTIONS.map((o) => o.label)).toEqual(['Compra', 'Consumo', 'Merma', 'Ajuste'])
  })

  it('asigna los tonos de estado esperados a cada tipo', () => {
    expect(KIND_TONES.purchase).toBe('completed')
    expect(KIND_TONES.consumption).toBeUndefined()
    expect(KIND_TONES.waste).toBe('cancelled')
    expect(KIND_TONES.adjustment).toBe('confirmed')
  })
})
