import { describe, expect, it } from 'vitest'

import type { PurchaseSuggestion } from '../../api/types'
import { type LineDraft, linesForApi, linesFromSuggestions } from './purchaseLines'

function line(ingredientId: string, quantity: string, unitCost = ''): LineDraft {
  return { key: ingredientId, ingredientId, quantity, unitCost }
}

describe('linesForApi', () => {
  it('convierte las líneas completas y acepta coma decimal', () => {
    expect(linesForApi([line('3', '2,5', '4.20'), line('', '')])).toEqual([
      { ingredient_id: 3, quantity: '2.5', unit_cost: '4.20' },
    ])
  })

  it('un costo vacío vale cero', () => {
    expect(linesForApi([line('1', '1')])).toEqual([{ ingredient_id: 1, quantity: '1', unit_cost: '0' }])
  })

  it('sin líneas o con una a medias no hay orden', () => {
    expect(linesForApi([line('', '')])).toBeNull()
    expect(linesForApi([line('1', '0')])).toBeNull()
    expect(linesForApi([line('1', 'dos')])).toBeNull()
  })
})

describe('linesFromSuggestions', () => {
  it('trae la cantidad y el costo sugeridos', () => {
    const sugerencia = { ingredient_id: 7, quantity: '12.000', unit_cost: '3.50' } as PurchaseSuggestion
    const [linea] = linesFromSuggestions([sugerencia])
    expect(linea).toMatchObject({ ingredientId: '7', quantity: '12.000', unitCost: '3.50' })
  })
})
