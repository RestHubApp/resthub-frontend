// Escalas de los gráficos: ejes con números redondos y un solo origen en cero.

const NICE_STEPS = [1, 2, 2.5, 5, 10] as const

/** Un paso redondo (1, 2, 2.5, 5 × 10ⁿ) que parte `max` en unas `count` marcas. */
function niceStep(max: number, count: number): number {
  const crudo = max / count
  const magnitud = 10 ** Math.floor(Math.log10(crudo))
  const paso = NICE_STEPS.find((candidato) => candidato * magnitud >= crudo) ?? 10
  return paso * magnitud
}

/** Marcas del eje desde cero hasta un tope redondo que cubre `max`. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) {
    return [0, 1]
  }
  const paso = niceStep(max, count)
  const tope = Math.ceil(max / paso) * paso
  const marcas: number[] = []
  for (let valor = 0; valor <= tope + paso / 2; valor += paso) {
    marcas.push(Math.round(valor * 100) / 100)
  }
  return marcas
}

/** Índices repartidos a lo largo de una serie para rotular el eje sin amontonar. */
export function spreadIndices(length: number, maxLabels: number): number[] {
  if (length <= maxLabels) {
    return Array.from({ length }, (_, indice) => indice)
  }
  const paso = (length - 1) / (maxLabels - 1)
  return Array.from({ length: maxLabels }, (_, indice) => Math.round(indice * paso))
}

/** El índice del punto más cercano a una posición horizontal. */
export function nearestIndex(x: number, left: number, step: number, length: number): number {
  if (length <= 1 || step <= 0) {
    return 0
  }
  return Math.min(length - 1, Math.max(0, Math.round((x - left) / step)))
}
