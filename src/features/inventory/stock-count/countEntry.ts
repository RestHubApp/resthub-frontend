import type { CountLineRequest, EntryMode, IngredientUnit, StockCountLine } from '@/api/types'
import { formatQuantity } from '@/services/format'
import { contentByWeight, PACKAGE_UNIT, packageLabel, packagesToBase, roundQuantity, type WeightReading } from '@/features/inventory/packaging'
import { inputUnits, parseDecimal, toBaseQuantity } from '@/features/inventory/units'

// Cómo se cuenta una línea: en kg o g (la unidad del insumo), en envases o
// pesando el envase abierto. Cada forma se lleva a la unidad base para mostrar la
// conversión en vivo; lo que se guarda lo calcula el backend con lo escrito.

const WEIGHT = 'weight'
// eslint-disable-next-line security/detect-unsafe-regex -- sin retroceso catastrófico: recheck la clasifica como segura (ver sast.md)
const QUANTITY = /^\d+(?:[.,]\d{1,3})?$/u

/** Una forma de contar una línea: «kg», «botella», «Por peso». */
export interface CountOption {
  readonly value: string
  readonly label: string
  readonly mode: EntryMode
  /** Cuántas unidades base vale uno (en `weight`, 1: el peso va en gramos). */
  readonly factor: number
}

/** Lo que se está escribiendo en una línea, antes de guardarla. */
export interface CountDraft {
  readonly option: string
  readonly quantity: string
  /** Solo por peso: los envases cerrados que hay además del abierto. */
  readonly fullPackages: string
}

/** Lo que vale lo escrito: la cantidad base o por qué todavía no se puede guardar. */
export interface CountReading {
  readonly base: number | null
  readonly error: string | null
  /** Por peso: si la balanza marcó fuera del rango del envase. */
  readonly limit: WeightReading['limit']
}

export function unitOf(line: StockCountLine): IngredientUnit {
  return line.unit ?? 'unit'
}

/** Las formas de contar esta línea: su unidad, el envase si lo tiene, y el peso si el envase tiene sus pesos. */
export function countOptions(line: StockCountLine): readonly CountOption[] {
  const options: CountOption[] = inputUnits(unitOf(line)).map((unit) => ({ ...unit, mode: 'base' }))
  const { packaging } = line
  if (packaging !== null) {
    options.push({ value: PACKAGE_UNIT, label: packageLabel(packaging), mode: 'packages', factor: Number(packaging.size) })
    if (packaging.weighable) {
      options.push({ value: WEIGHT, label: 'Por peso', mode: 'weight', factor: 1 })
    }
  }
  return options
}

function optionOf(line: StockCountLine, value: string): CountOption | undefined {
  return countOptions(line).find((option) => option.value === value)
}

// «3.000» se muestra «3»; cero o nada, vacío.
function shownNumber(value: string | null): string {
  return value === null || Number(value) === 0 ? '' : String(Number(value))
}

/** Con qué forma se escribió la última vez; sin conteo, el envase si lo hay (o kg, L, unid.). */
function optionWritten(line: StockCountLine): string {
  const byMode: Record<EntryMode, string> = { packages: PACKAGE_UNIT, weight: WEIGHT, base: unitOf(line) }
  if (line.entry_mode !== null) {
    return byMode[line.entry_mode]
  }
  return line.packaging === null ? (countOptions(line)[0]?.value ?? unitOf(line)) : PACKAGE_UNIT
}

/** Lo escrito la última vez, o vacío. */
export function draftOf(line: StockCountLine): CountDraft {
  const option = optionWritten(line)
  return {
    option,
    quantity: line.entry_quantity === null ? '' : String(Number(line.entry_quantity)),
    fullPackages: option === WEIGHT ? shownNumber(line.entry_full_packages) : '',
  }
}

function invalid(error: string | null): CountReading {
  return { base: null, error, limit: null }
}

function readWeight(draft: CountDraft, line: StockCountLine): CountReading {
  const full = draft.fullPackages.trim()
  if (full !== '' && !QUANTITY.test(full)) {
    return invalid('Los envases cerrados: un número con hasta 3 decimales')
  }
  const reading = line.packaging === null ? null : contentByWeight(parseDecimal(draft.quantity), line.packaging)
  if (reading === null || line.packaging === null) {
    return invalid('Este insumo no tiene los pesos del envase')
  }
  const closed = full === '' ? 0 : packagesToBase(parseDecimal(full), line.packaging)
  return { base: roundQuantity(closed + reading.content), error: null, limit: reading.limit }
}

/** Lo que vale lo escrito en la unidad base. Sin nada escrito, ni cantidad ni error. */
export function readDraft(draft: CountDraft, line: StockCountLine): CountReading {
  const quantity = draft.quantity.trim()
  if (quantity === '') {
    return invalid(null)
  }
  if (!QUANTITY.test(quantity)) {
    return invalid('Escribe un número con hasta 3 decimales')
  }
  const option = optionOf(line, draft.option)
  if (option === undefined) {
    return invalid('Elige cómo cuentas')
  }
  if (option.mode === 'weight') {
    return readWeight(draft, line)
  }
  return { base: roundQuantity(parseDecimal(quantity) * option.factor), error: null, limit: null }
}

/** «= 2.25 L», o el aviso de la balanza fuera de rango. */
export function readingText(reading: CountReading, line: StockCountLine): string | null {
  if (reading.base === null) {
    return null
  }
  const total = `= ${formatQuantity(reading.base, unitOf(line))}`
  if (reading.limit === 'empty') {
    return `${total}. Pesa como un envase vacío: el abierto cuenta como vacío.`
  }
  if (reading.limit === 'full') {
    return `${total}. Pesa como uno lleno: el abierto cuenta como lleno.`
  }
  return total
}

/** La línea para `PUT /stock-counts/{id}/lines`: en la unidad base, en envases o por peso. */
export function countLinePayload(line: StockCountLine, draft: CountDraft): CountLineRequest {
  const option = optionOf(line, draft.option)
  const mode = option?.mode ?? 'base'
  const fullPackages = mode === 'weight' && draft.fullPackages.trim() !== '' ? toBaseQuantity(draft.fullPackages, 1) : '0'
  return {
    ingredient_id: line.ingredient_id,
    mode,
    quantity: toBaseQuantity(draft.quantity, mode === 'base' ? (option?.factor ?? 1) : 1),
    full_packages: fullPackages,
  }
}

/** Para dejar una línea sin contar. */
export function clearLinePayload(line: StockCountLine): CountLineRequest {
  return { ingredient_id: line.ingredient_id, mode: 'base', quantity: null, full_packages: '0' }
}
