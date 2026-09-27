import { describe, expect, it } from '@jest/globals'

import { insumo, receta } from '#jest/fixtures/inventario'
import { adjustmentDelta, adjustmentPayload } from './adjustmentMath'
import { EMPTY_INGREDIENT, ingredientNumbers, ingredientValuesOf } from './ingredientValues'
import { adjustmentSchema, ingredientSchema, purchaseSchema, recipeSchema, wasteSchema } from './inventorySchema'
import { costHint, costLabel, purchaseDefaults, purchaseMath, purchasePayload } from './purchaseMath'
import { availableIngredients, lineCost, recipeCatalog, recipeCost, recipePayload, recipeValuesOf } from './recipeMath'
import { findInputUnit, formatUnitCost, fromBase, inputUnits, priceUnit, toBaseCost, toBaseQuantity } from './units'

const LIMON = insumo()

// Intl separa «S/» del monto con un espacio que no se corta.
function plano(texto: string | undefined): string | undefined {
  return texto?.replace(/\s/gu, ' ')
}
const COMPRA = { quantity: '5', quantity_unit: 'kg', cost_mode: 'unit' as const, cost: '4.20', reason: '' }

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
    expect(plano(formatUnitCost('0.0042', 'g'))).toBe('S/ 4.20 por kg')
  })
})

describe('purchaseMath', () => {
  it('con el precio por kilo calcula el total', () => {
    expect(purchaseMath(COMPRA, 'g')).toEqual({ baseQuantity: 5000, pricePerUnit: 4.2, total: 21 })
    expect(plano(costHint(purchaseMath(COMPRA, 'g'), 'kg'))).toBe('Total S/ 21.00 · sale a S/ 4.20 por kg')
  })

  it('con el total pagado calcula el precio por kilo', () => {
    const cuentas = purchaseMath({ ...COMPRA, quantity: '500', quantity_unit: 'g', cost_mode: 'total', cost: '3' }, 'g')
    expect(cuentas?.pricePerUnit).toBeCloseTo(6)
    expect(cuentas?.total).toBe(3)
  })

  it('mientras falte un dato no hay cuentas', () => {
    expect(purchaseMath({ ...COMPRA, quantity: '' }, 'g')).toBeNull()
    expect(purchaseMath({ ...COMPRA, cost: 'abc' }, 'g')).toBeNull()
    expect(costHint(null, 'kg')).toBeUndefined()
  })

  it('envía la compra en gramos y el costo por gramo, en los dos modos', () => {
    expect(purchasePayload(1, COMPRA, 'g')).toEqual({ ingredient_id: 1, quantity: '5000', unit_cost: '0.0042', reason: '' })
    expect(purchasePayload(1, { ...COMPRA, cost_mode: 'total', cost: '21' }, 'g').unit_cost).toBe('0.0042')
  })

  it('propone el costo actual del insumo por kilo y la unidad grande', () => {
    expect(purchaseDefaults(LIMON)).toMatchObject({ quantity_unit: 'kg', cost: '4', cost_mode: 'unit' })
    expect(purchaseDefaults(insumo({ unit_cost: '0' })).cost).toBe('')
    expect(costLabel('total', 'kg')).toBe('Total pagado (S/)')
    expect(costLabel('unit', 'kg')).toBe('Costo por kg (S/)')
  })
})

describe('adjustmentMath', () => {
  const conteo = { mode: 'count' as const, quantity: '3', quantity_unit: 'kg', sign: 'subtract' as const }

  it('un conteo cambia el stock en la diferencia con lo que hay', () => {
    expect(adjustmentDelta(conteo, LIMON)).toBe(-2000)
    expect(adjustmentDelta({ ...conteo, quantity: '' }, LIMON)).toBeNull()
  })

  it('una diferencia suma o resta lo escrito', () => {
    expect(adjustmentDelta({ ...conteo, mode: 'difference' }, LIMON)).toBe(-3000)
    expect(adjustmentDelta({ ...conteo, mode: 'difference', sign: 'add' }, LIMON)).toBe(3000)
  })

  it('envía lo contado para que el servidor calcule, o la diferencia con signo', () => {
    expect(adjustmentPayload({ ...conteo, reason: 'Conteo' }, LIMON)).toEqual({ ingredient_id: 1, reason: 'Conteo', counted_stock: '3000' })
    expect(adjustmentPayload({ ...conteo, mode: 'difference', reason: 'Rotura' }, LIMON).quantity).toBe('-3000')
    expect(adjustmentPayload({ ...conteo, mode: 'difference', sign: 'add', reason: 'x' }, LIMON).quantity).toBe('3000')
  })
})

describe('ingredientValues', () => {
  it('muestra un insumo en kilos para editarlo', () => {
    expect(ingredientValuesOf(LIMON)).toEqual({ name: 'Limón', unit: 'g', min_stock: '2', min_stock_unit: 'kg', unit_cost: '4' })
    expect(ingredientValuesOf(insumo({ unit_cost: '0' })).unit_cost).toBe('')
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
  const catalogo = recipeCatalog([LIMON, insumo({ id: 2, name: 'Cebolla', unit_cost: '0.002' })], receta())

  it('costea cada línea y la receta con el costo actual de los insumos', () => {
    expect(lineCost('250', catalogo.get(1))).toBe(1)
    expect(lineCost('abc', catalogo.get(1))).toBe(0)
    expect(lineCost('10', undefined)).toBe(0)
    expect(recipeCost([{ ingredient_id: 1, quantity: '250' }, { ingredient_id: 2, quantity: '100' }], catalogo)).toBeCloseTo(1.2)
  })

  it('una línea con un insumo que ya no está activo se costea con lo que trae la receta', () => {
    const soloReceta = recipeCatalog([], receta())
    expect(soloReceta.get(1)).toEqual({ id: 1, name: 'Limón', unit: 'g', unitCost: 0.004 })
  })

  it('ofrece para agregar solo lo que no está en la receta', () => {
    const libres = availableIngredients([LIMON, insumo({ id: 2, name: 'Cebolla' })], recipeValuesOf(receta()).lines, catalogo)
    expect(libres.map((i) => i.name)).toEqual(['Cebolla'])
  })

  it('envía las cantidades con punto decimal', () => {
    expect(recipePayload({ lines: [{ ingredient_id: 1, quantity: ' 2,5 ' }] })).toEqual({ lines: [{ ingredient_id: 1, quantity: '2.5' }] })
    expect(recipeValuesOf(receta()).lines).toEqual([{ ingredient_id: 1, quantity: '250' }])
  })
})

describe('inventorySchema', () => {
  it('una compra pide una cantidad mayor que cero, con hasta tres decimales y sin exagerar', () => {
    const errores = (quantity: string) => purchaseSchema.safeParse({ ...COMPRA, quantity }).error?.issues[0]?.message
    expect(errores('0')).toBe('Tiene que ser mayor que cero')
    expect(errores('1.2345')).toBe('Escribe un número con hasta 3 decimales')
    expect(errores('100001')).toBe('Es demasiado. Revisa el dato')
    expect(errores('2,5')).toBeUndefined()
  })

  it('una merma exige motivo; un conteo acepta cero pero una diferencia no', () => {
    expect(wasteSchema.safeParse({ quantity: '1', quantity_unit: 'g', reason: '' }).success).toBe(false)
    const ajuste = { mode: 'count', quantity: '0', quantity_unit: 'g', sign: 'add', reason: 'Conteo físico' }
    expect(adjustmentSchema.safeParse(ajuste).success).toBe(true)
    expect(adjustmentSchema.safeParse({ ...ajuste, mode: 'difference' }).error?.issues[0]?.message).toBe(
      'Una diferencia tiene que ser mayor que cero',
    )
  })

  it('un insumo necesita nombre y una receta cantidades positivas', () => {
    expect(ingredientSchema.safeParse(EMPTY_INGREDIENT).error?.issues[0]?.message).toBe('Escribe el nombre del insumo')
    expect(recipeSchema.safeParse({ lines: [{ ingredient_id: 1, quantity: '0' }] }).success).toBe(false)
  })
})
