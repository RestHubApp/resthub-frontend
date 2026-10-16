import { describe, expect, it } from '@jest/globals'

import { ingredient, recipe } from '#jest/fixtures/inventory'
import { packaging } from '#jest/fixtures/stockControl'
import { adjustmentDelta, adjustmentPayload } from './adjustmentMath'
import { EMPTY_INGREDIENT, ingredientNumbers, ingredientValuesOf } from './ingredientValues'
import { adjustmentSchema, ingredientSchema, purchaseSchema, recipeSchema, wasteSchema } from './inventorySchema'
import { costHint, costLabel, packageHint, purchaseDefaults, purchaseMath, purchasePayload, purchaseUnits } from './purchaseMath'
import { availableIngredients, lineCost, recipeCatalog, recipeCost, recipePayload, recipeValuesOf } from './recipeMath'
import { findInputUnit, formatUnitCost, fromBase, inputUnits, priceUnit, toBaseCost, toBaseQuantity } from './units'

const LIMON = ingredient()

// Intl separa «S/» del monto con un espacio que no se corta.
function flat(text: string | undefined): string | undefined {
  return text?.replaceAll(/\s/gu, ' ')
}
const PURCHASE = { quantity: '5', quantity_unit: 'kg', cost_mode: 'unit' as const, cost: '4.20', reason: '' }

describe('units', () => {
  it('ofrece kilos y gramos para el peso, litros y ml para el volumen, y solo unidades para lo demás', () => {
    expect(inputUnits('g').map((u) => u.value)).toEqual(['kg', 'g'])
    expect(inputUnits('ml').map((u) => u.label)).toEqual(['L', 'ml'])
    expect(inputUnits('unit').map((u) => u.label)).toEqual(['unid.'])
    expect(findInputUnit('g', 'litro').value).toBe('g')
    expect(priceUnit('unit').factor).toBe(1)
  })

  it('pasa cantidades y costos a la unidad base y de vuelta, sin ceros de más', () => {
    expect(toBaseQuantity('5,6', 1000)).toBe('5600')
    expect(toBaseQuantity('0.0015', 1000)).toBe('1.5')
    expect(toBaseCost(4.2, 1000)).toBe('0.0042')
    expect(fromBase('5600', 1000)).toBe('5.6')
    expect(flat(formatUnitCost('0.0042', 'g'))).toBe('S/ 4.20 por kg')
  })
})

describe('purchaseMath', () => {
  it('con el precio por kilo calcula el total', () => {
    expect(purchaseMath(PURCHASE, LIMON)).toEqual({ baseQuantity: 5000, pricePerUnit: 4.2, total: 21 })
    expect(flat(costHint(purchaseMath(PURCHASE, LIMON), 'kg'))).toBe('Total S/ 21.00 · sale a S/ 4.20 por kg')
  })

  it('con el total pagado calcula el precio por kilo', () => {
    const accounts = purchaseMath({ ...PURCHASE, quantity: '500', quantity_unit: 'g', cost_mode: 'total', cost: '3' }, LIMON)
    expect(accounts?.pricePerUnit).toBeCloseTo(6)
    expect(accounts?.total).toBe(3)
  })

  it('mientras falte un dato no hay cuentas', () => {
    expect(purchaseMath({ ...PURCHASE, quantity: '' }, LIMON)).toBeNull()
    expect(purchaseMath({ ...PURCHASE, cost: 'abc' }, LIMON)).toBeNull()
    expect(costHint(null, 'kg')).toBeUndefined()
  })

  it('envía la compra en gramos y el costo por gramo, en los dos modos', () => {
    expect(purchasePayload(PURCHASE, LIMON)).toEqual({ ingredient_id: 1, entry_mode: 'base', quantity: '5000', unit_cost: '0.0042', reason: '' })
    expect(purchasePayload({ ...PURCHASE, cost_mode: 'total', cost: '21' }, LIMON).unit_cost).toBe('0.0042')
  })

  it('en envases: ofrece la botella, muestra la conversión y envía cuántas con el costo por ml', () => {
    const pisco = ingredient({ id: 2, name: 'Pisco', unit: 'ml', unit_label: 'mililitros', packaging: packaging() })
    const bottles = { quantity: '4', quantity_unit: 'package', cost_mode: 'total' as const, cost: '120', reason: '' }
    expect(purchaseUnits(pisco).map((unit) => unit.label)).toEqual(['L', 'ml', 'botella'])
    expect(purchaseUnits(LIMON).map((unit) => unit.value)).toEqual(['kg', 'g'])
    expect(flat(packageHint(bottles, pisco))).toBe('4 × botella de 750 ml = 3 L')
    expect(packageHint({ ...bottles, quantity_unit: 'l' }, pisco)).toBeUndefined()
    expect(purchaseMath(bottles, pisco)).toMatchObject({ baseQuantity: 3000, total: 120 })
    // S/ 120 por 4 botellas de 750 ml: S/ 0.04 el mililitro.
    expect(purchasePayload(bottles, pisco)).toEqual({ ingredient_id: 2, entry_mode: 'packages', quantity: '4', unit_cost: '0.04', reason: '' })
    expect(purchasePayload({ ...bottles, cost_mode: 'unit', cost: '40' }, pisco).unit_cost).toBe('0.04')
  })

  it('propone el costo actual del insumo por kilo y la unidad grande', () => {
    expect(purchaseDefaults(LIMON)).toMatchObject({ quantity_unit: 'kg', cost: '4', cost_mode: 'unit' })
    expect(purchaseDefaults(ingredient({ unit_cost: '0' })).cost).toBe('')
    expect(costLabel('total', 'kg')).toBe('Total pagado (S/)')
    expect(costLabel('unit', 'kg')).toBe('Costo por kg (S/)')
  })
})

describe('adjustmentMath', () => {
  const count = { mode: 'count' as const, quantity: '3', quantity_unit: 'kg', sign: 'subtract' as const }

  it('un conteo cambia el stock en la diferencia con lo que hay', () => {
    expect(adjustmentDelta(count, LIMON)).toBe(-2000)
    expect(adjustmentDelta({ ...count, quantity: '' }, LIMON)).toBeNull()
  })

  it('una diferencia suma o resta lo escrito', () => {
    expect(adjustmentDelta({ ...count, mode: 'difference' }, LIMON)).toBe(-3000)
    expect(adjustmentDelta({ ...count, mode: 'difference', sign: 'add' }, LIMON)).toBe(3000)
  })

  it('envía lo contado para que el servidor calcule, o la diferencia con signo', () => {
    expect(adjustmentPayload({ ...count, reason: 'Conteo' }, LIMON)).toEqual({ ingredient_id: 1, reason: 'Conteo', counted_stock: '3000' })
    expect(adjustmentPayload({ ...count, mode: 'difference', reason: 'Rotura' }, LIMON).quantity).toBe('-3000')
    expect(adjustmentPayload({ ...count, mode: 'difference', sign: 'add', reason: 'x' }, LIMON).quantity).toBe('3000')
  })
})

describe('ingredientValues', () => {
  it('muestra un insumo en kilos para editarlo', () => {
    expect(ingredientValuesOf(LIMON)).toMatchObject({ name: 'Limón', unit: 'g', min_stock: '2', min_stock_unit: 'kg', unit_cost: '4', packaging_size: '' })
    expect(ingredientValuesOf(ingredient({ unit_cost: '0' })).unit_cost).toBe('')
  })

  it('vacío vale cero, y lo escrito se lleva a la unidad base', () => {
    expect(ingredientNumbers(EMPTY_INGREDIENT, 'g')).toEqual({ min_stock: '0', unit_cost: '0' })
    expect(ingredientNumbers({ ...EMPTY_INGREDIENT, min_stock: '1,5', unit_cost: '8' }, 'g')).toEqual({
      min_stock: '1500',
      unit_cost: '0.008',
    })
  })
})

describe('recipeMath', () => {
  const catalog = recipeCatalog([LIMON, ingredient({ id: 2, name: 'Cebolla', unit_cost: '0.002' })], recipe())

  it('costea cada línea y la receta con el costo actual de los insumos', () => {
    expect(lineCost('250', catalog.get(1))).toBe(1)
    expect(lineCost('abc', catalog.get(1))).toBe(0)
    expect(lineCost('10', undefined)).toBe(0)
    expect(recipeCost([{ ingredient_id: 1, quantity: '250' }, { ingredient_id: 2, quantity: '100' }], catalog)).toBeCloseTo(1.2)
  })

  it('una línea con un insumo que ya no está activo se costea con lo que trae la receta', () => {
    const onlyRecipe = recipeCatalog([], recipe())
    expect(onlyRecipe.get(1)).toEqual({ id: 1, name: 'Limón', unit: 'g', unitCost: 0.004 })
  })

  it('ofrece para agregar solo lo que no está en la receta', () => {
    const free = availableIngredients([LIMON, ingredient({ id: 2, name: 'Cebolla' })], recipeValuesOf(recipe()).lines, catalog)
    expect(free.map((i) => i.name)).toEqual(['Cebolla'])
  })

  it('envía las cantidades con punto decimal', () => {
    expect(recipePayload({ lines: [{ ingredient_id: 1, quantity: ' 2,5 ' }] })).toEqual({ lines: [{ ingredient_id: 1, quantity: '2.5' }] })
    expect(recipeValuesOf(recipe()).lines).toEqual([{ ingredient_id: 1, quantity: '250' }])
  })
})

describe('inventorySchema', () => {
  it('una compra pide una cantidad mayor que cero, con hasta tres decimales y sin exagerar', () => {
    const errors = (quantity: string) => purchaseSchema.safeParse({ ...PURCHASE, quantity }).error?.issues[0]?.message
    expect(errors('0')).toBe('Tiene que ser mayor que cero')
    expect(errors('1.2345')).toBe('Escribe un número con hasta 3 decimales')
    expect(errors('100001')).toBe('Es demasiado. Revisa el dato')
    expect(errors('2,5')).toBeUndefined()
  })

  it('una merma exige motivo; un conteo acepta cero pero una diferencia no', () => {
    expect(wasteSchema.safeParse({ quantity: '1', quantity_unit: 'g', reason: '' }).success).toBe(false)
    const adjustment = { mode: 'count', quantity: '0', quantity_unit: 'g', sign: 'add', reason: 'Conteo físico' }
    expect(adjustmentSchema.safeParse(adjustment).success).toBe(true)
    expect(adjustmentSchema.safeParse({ ...adjustment, mode: 'difference' }).error?.issues[0]?.message).toBe(
      'Una diferencia tiene que ser mayor que cero',
    )
  })

  it('un insumo necesita nombre y una receta cantidades positivas', () => {
    expect(ingredientSchema.safeParse(EMPTY_INGREDIENT).error?.issues[0]?.message).toBe('Escribe el nombre del insumo')
    expect(recipeSchema.safeParse({ lines: [{ ingredient_id: 1, quantity: '0' }] }).success).toBe(false)
  })
})
