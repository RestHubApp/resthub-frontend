import type { IngredientUnit } from '../../api/types'
import { formatMoney } from '../../services/format'

// El inventario guarda cada cantidad en la unidad base (gramos, mililitros o
// unidades), que es la que suma sin errores. La gente, en cambio, compra por
// kilo y por litro: acá se traduce en los dos sentidos.

/** Una unidad en la que se puede escribir una cantidad, y cuántas unidades base vale. */
export interface InputUnit {
  readonly value: string
  readonly label: string
  readonly factor: number
}

const BASE: Record<IngredientUnit, InputUnit> = {
  g: { value: 'g', label: 'g', factor: 1 },
  ml: { value: 'ml', label: 'ml', factor: 1 },
  unit: { value: 'unit', label: 'unid.', factor: 1 },
}

const GRANDE: Partial<Record<IngredientUnit, InputUnit>> = {
  g: { value: 'kg', label: 'kg', factor: 1000 },
  ml: { value: 'l', label: 'L', factor: 1000 },
}

/** Nombre de cada unidad en la lista de alta de un insumo. */
export const UNIT_OPTIONS: readonly { readonly value: IngredientUnit; readonly label: string }[] = [
  { value: 'g', label: 'Peso (se cuenta en g y kg)' },
  { value: 'ml', label: 'Volumen (se cuenta en ml y L)' },
  { value: 'unit', label: 'Unidades (botellas, latas, piezas)' },
]

/** Las unidades para escribir una cantidad, la más grande primero: se compra por kilo. */
export function inputUnits(unit: IngredientUnit): readonly InputUnit[] {
  const grande = GRANDE[unit]
  return grande === undefined ? [BASE[unit]] : [grande, BASE[unit]]
}

export function findInputUnit(unit: IngredientUnit, value: string): InputUnit {
  return inputUnits(unit).find((opcion) => opcion.value === value) ?? BASE[unit]
}

/** La unidad en que se muestran los precios: por kilo, por litro o por unidad. */
export function priceUnit(unit: IngredientUnit): InputUnit {
  return GRANDE[unit] ?? BASE[unit]
}

export function baseUnitLabel(unit: IngredientUnit): string {
  return BASE[unit].label
}

/** "S/ 4.20 por kg": el costo guardado por gramo, mostrado por kilo. */
export function formatUnitCost(unitCost: string | number, unit: IngredientUnit): string {
  const precio = priceUnit(unit)
  return `${formatMoney(Number(unitCost) * precio.factor)} por ${precio.label}`
}

// "5.600" pasa a "5.6". Los textos llegan de `toFixed`, así que nunca son
// tan chicos como para que `String` los escriba en notación científica.
function sinCerosFinales(texto: string): string {
  return String(Number(texto))
}

/** Un número escrito por la persona, con punto o coma. */
export function parseDecimal(texto: string): number {
  return Number(texto.trim().replace(',', '.'))
}

/** La cantidad en la unidad base, como texto decimal para el API (hasta 3 decimales). */
export function toBaseQuantity(texto: string, factor: number): string {
  return sinCerosFinales((parseDecimal(texto) * factor).toFixed(3))
}

/** Un costo por kilo o por litro, llevado a la unidad base (hasta 6 decimales). */
export function toBaseCost(costo: number, factor: number): string {
  return sinCerosFinales((costo / factor).toFixed(6))
}

/** Una cantidad base mostrada en la unidad elegida, para rellenar un campo. */
export function fromBase(value: string | number, factor: number): string {
  return sinCerosFinales((Number(value) / factor).toFixed(3))
}
