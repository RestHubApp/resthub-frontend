// Escalas de los gráficos: ejes con números redondos y un solo origen en cero.

const NICE_STEPS = [1, 2, 2.5, 5, 10] as const

/** Un paso redondo (1, 2, 2.5, 5 × 10ⁿ) que parte `max` en unas `count` marcas. */
function niceStep(max: number, count: number): number {
  const raw = max / count
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = NICE_STEPS.find((candidate) => candidate * magnitude >= raw) ?? 10
  return step * magnitude
}

/** Marcas del eje desde cero hasta un tope redondo que cubre `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) {
    return [0, 1]
  }
  const step = niceStep(max, count)
  const cap = Math.ceil(max / step) * step
  const marks: number[] = []
  for (let value = 0; value <= cap + step / 2; value += step) {
    marks.push(Math.round(value * 100) / 100)
  }
  return marks
}

/** Índices repartidos a lo largo de una serie para rotular el eje sin amontonar. */
export function spreadIndexes(length: number, maxLabels: number): number[] {
  if (length <= maxLabels) {
    return Array.from({ length }, (_, index) => index)
  }
  const step = (length - 1) / (maxLabels - 1)
  return Array.from({ length: maxLabels }, (_, index) => Math.round(index * step))
}

/** El índice del punto más cercano a una posición horizontal. */
export function nearestIndex(x: number, left: number, step: number, length: number): number {
  if (length <= 1 || step <= 0) {
    return 0
  }
  return Math.min(length - 1, Math.max(0, Math.round((x - left) / step)))
}
