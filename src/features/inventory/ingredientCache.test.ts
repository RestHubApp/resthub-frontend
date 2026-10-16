import { describe, expect, it, jest } from '@jest/globals'
import { QueryClient } from '@tanstack/react-query'

import { ingredientsQuery, inventoryQueryKey, lowStockQuery } from '@/api/inventory'
import type { Ingredient, StockChange } from '@/api/types'
import { saveIngredient } from './ingredientCache'

const ARROZ = 'Arroz'

function ingredient(id: number, name: string, overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id,
    name,
    stock: '10',
    min_stock: '5',
    unit: 'g',
    unit_cost: '1.00',
    unit_label: 'Gramos',
    is_active: true,
    is_low: false,
    is_negative: false,
    packaging: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('saveIngredient', () => {
  it('agrega o actualiza un insumo activo en la lista ordenado por nombre', () => {
    const qc = new QueryClient()
    qc.setQueryData(ingredientsQuery.queryKey, [ingredient(1, ARROZ), ingredient(3, 'Cebolla')])

    saveIngredient(qc, ingredient(2, 'Azúcar'))

    const actual = qc.getQueryData<Ingredient[]>(ingredientsQuery.queryKey)
    expect(actual?.map((i) => i.name)).toEqual([ARROZ, 'Azúcar', 'Cebolla'])
  })

  it('quita un insumo desactivado de la lista principal y de las alertas', () => {
    const qc = new QueryClient()
    const tomate = ingredient(2, 'Tomate', { stock: '2', min_stock: '5', is_low: true })
    qc.setQueryData(ingredientsQuery.queryKey, [ingredient(1, ARROZ), tomate])
    qc.setQueryData(lowStockQuery.queryKey, [tomate])

    const disabled = { ...tomate, is_active: false }
    saveIngredient(qc, disabled)

    expect(qc.getQueryData<Ingredient[]>(ingredientsQuery.queryKey)?.map((i) => i.id)).toEqual([1])
    expect(qc.getQueryData<Ingredient[]>(lowStockQuery.queryKey)?.map((i) => i.id)).toEqual([])
  })

  it('actualiza las alertas ordenando negativos primero y luego por distancia al mínimo', () => {
    const qc = new QueryClient()
    qc.setQueryData(lowStockQuery.queryKey, [ingredient(1, 'Papas', { stock: '4', min_stock: '10', is_low: true })])

    const carne = ingredient(2, 'Carne', { stock: '-1', min_stock: '10', is_low: true, is_negative: true })
    saveIngredient(qc, carne)

    const actual = qc.getQueryData<Ingredient[]>(lowStockQuery.queryKey)
    expect(actual?.map((i) => i.name)).toEqual(['Carne', 'Papas'])
  })

  it('acepta un resultado de tipo StockChange y extrae el insumo', () => {
    const qc = new QueryClient()
    qc.setQueryData(ingredientsQuery.queryKey, [ingredient(1, ARROZ, { stock: '10' })])

    const stockChange: StockChange = {
      movement: {
        id: 1,
        created_at: '2026-01-01T00:00:00Z',
        created_by: 1,
        ingredient_id: 1,
        ingredient_name: ARROZ,
        kind: 'purchase',
        kind_label: 'Compra',
        order_id: null,
        order_item_id: null,
        order_number: null,
        quantity: '5',
        reason: '',
        unit: 'g',
        unit_cost: '15',
        entry_mode: 'base',
        entry_quantity: '5',
        stock_count_id: null,
      },
      ingredient: ingredient(1, ARROZ, { stock: '15' }),
    }

    saveIngredient(qc, stockChange)

    const actual = qc.getQueryData<Ingredient[]>(ingredientsQuery.queryKey)
    expect(actual?.[0]?.stock).toBe('15')
  })

  it('invalida la clave de inventario', () => {
    const qc = new QueryClient()
    const spy = jest.spyOn(qc, 'invalidateQueries')

    saveIngredient(qc, ingredient(1, ARROZ))

    expect(spy).toHaveBeenCalledWith({ queryKey: inventoryQueryKey })
  })
})
