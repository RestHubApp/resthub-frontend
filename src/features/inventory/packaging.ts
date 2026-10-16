import type { IngredientUnit, Packaging } from '@/api/types'
import { formatQuantity } from '@/services/format'
import type { InputUnit } from './units'

// La presentación de un insumo («botella de 750 ml») y sus cuentas: n envases
// a la unidad base y, si el envase tiene sus pesos, lo que queda en uno
// abierto según lo que marca la balanza. Repiten las del backend, que es quien
// guarda: acá solo se muestran mientras se escribe.

/** El valor del envase en una lista de unidades, junto a kg y g. */
export const PACKAGE_UNIT = 'package'

const DEFAULT_LABEL = 'envase'
const THOUSANDTHS = 1000

/** Redondea a tres decimales, la mitad hacia arriba, como el backend. */
export function roundQuantity(value: number): number {
  return Math.round(value * THOUSANDTHS) / THOUSANDTHS
}

/** «botella», o «envase» si la presentación no tiene nombre. */
export function packageLabel(packaging: Packaging): string {
  return packaging.label.trim() === '' ? DEFAULT_LABEL : packaging.label
}

/** «botella de 750 ml». */
export function packageName(packaging: Packaging, unit: IngredientUnit): string {
  return `${packageLabel(packaging)} de ${formatQuantity(packaging.size, unit)}`
}

/** El envase como una unidad más para escribir una cantidad: vale lo que trae. */
export function packageUnit(packaging: Packaging): InputUnit {
  return { value: PACKAGE_UNIT, label: packageLabel(packaging), factor: Number(packaging.size) }
}

/** Cuánto suman `count` envases, en la unidad base. */
export function packagesToBase(count: number, packaging: Packaging): number {
  return roundQuantity(count * Number(packaging.size))
}

/** Lo que queda en un envase abierto y si la balanza marcó fuera del rango del envase. */
export interface WeightReading {
  /** En la unidad base, entre cero y lo que trae un envase lleno. */
  readonly content: number
  /** `empty`: pesa lo mismo o menos que vacío; `full`: lo mismo o más que lleno. */
  readonly limit: 'empty' | 'full' | null
}

/**
 * Lo que queda en un envase abierto, según lo que pesa.
 *
 * Contenido = (peso − vacío) / (lleno − vacío) × tamaño, acotado entre cero y
 * el tamaño: una balanza que marca de más o de menos no inventa stock ni lo
 * vuelve negativo. `null` si el envase no tiene sus dos pesos.
 */
export function contentByWeight(weightG: number, packaging: Packaging): WeightReading | null {
  if (packaging.full_weight_g === null || packaging.empty_weight_g === null) {
    return null
  }
  const full = Number(packaging.full_weight_g)
  const empty = Number(packaging.empty_weight_g)
  const size = Number(packaging.size)
  const content = roundQuantity(((weightG - empty) / (full - empty)) * size)
  if (content <= 0) {
    return { content: 0, limit: 'empty' }
  }
  if (content >= size) {
    return { content: size, limit: 'full' }
  }
  return { content, limit: null }
}
