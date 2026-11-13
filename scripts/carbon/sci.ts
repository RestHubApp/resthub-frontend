import { co2 } from '@tgwf/co2'

import type { RouteResult } from './report.ts'

/**
 * El indicador SCI (Software Carbon Intensity, ISO/IEC 21031:2024) de una
 * primera visita: SCI = (E × I) + M por R.
 *
 * - E: energía de operar el centro de datos, la red y el dispositivo para
 *   transferir los bytes de la visita (kWh, Sustainable Web Design v4).
 * - I: intensidad de carbono de la red eléctrica (g CO2e/kWh); SWD v4 usa la
 *   media mundial porque las visitas llegan de cualquier red.
 * - M: emisiones incorporadas (fabricación) de ese mismo hardware, en la parte
 *   que le toca a la visita.
 * - R: la unidad funcional, una primera visita sin caché.
 *
 * Sale del mismo modelo que la nota A+ (no es otra medición): SCI por visita es
 * igual a los gramos del informe, separados en su parte operativa y la incorporada.
 */
export interface Sci {
  readonly energyKwh: number
  readonly gridIntensity: number
  readonly embodiedGrams: number
  readonly grams: number
}

const SEGMENTED = new co2({ model: 'swd', version: 4, results: 'segment' })

export function sciOf(bytes: number): Sci {
  const energy = SEGMENTED.model.operationalEnergyPerSegment(bytes)
  const energyKwh = energy.dataCenter + energy.network + energy.device
  const visit = SEGMENTED.perVisit(bytes)
  return {
    energyKwh,
    gridIntensity: energyKwh > 0 ? visit.totalOperationalCO2e / energyKwh : 0,
    embodiedGrams: visit.totalEmbodiedCO2e,
    grams: visit.totalOperationalCO2e + visit.totalEmbodiedCO2e,
  }
}

/** Una línea por ruta con E, I, M y el SCI por primera visita. */
export function sciLines(results: readonly RouteResult[]): string[] {
  return results.map(({ route, bytes }) => {
    const { energyKwh, gridIntensity, embodiedGrams, grams } = sciOf(bytes)
    return `     ${route.path.padEnd(20)} E ${energyKwh.toFixed(7)} kWh × I ${gridIntensity.toFixed(0)} g/kWh + M ${embodiedGrams.toFixed(4)} g = ${grams.toFixed(4)} gCO2e por visita`
  })
}
