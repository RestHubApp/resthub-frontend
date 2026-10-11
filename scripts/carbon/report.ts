import { totalBytes, type Resource } from './resources.ts'
import { estimate, isAtLeast, type Estimate, type Grade } from './grade.ts'
import type { Route } from './routes.ts'

export interface RouteResult extends Estimate {
  readonly route: Route
  readonly resources: readonly Resource[]
  readonly passes: boolean
}

/** La nota de una visita y si cumple la mínima. */
export function resultOf(route: Route, resources: readonly Resource[], minimum: Grade): RouteResult {
  const emissions = estimate(totalBytes(resources))
  return { ...emissions, route, resources, passes: isAtLeast(emissions.grade, minimum) }
}

function kilobytes(bytes: number): string {
  return (bytes / 1000).toFixed(1)
}

/** Lo que el service worker agrega a la visita: los archivos que la página no pidió y él sí. */
function workerBytes(resources: readonly Resource[]): number {
  return totalBytes(resources.filter((resource) => resource.origin === 'service-worker'))
}

/** Una línea por ruta: ruta, kB (y cuántos son del service worker), gramos de CO2e por visita y nota. */
export function summaryLines(results: readonly RouteResult[]): string[] {
  return results.map(
    ({ route, bytes, grams, grade, passes, resources }) =>
      `${passes ? 'ok  ' : 'FAIL'} ${route.path.padEnd(20)} ${kilobytes(bytes).padStart(7)} kB (sw ${kilobytes(workerBytes(resources)).padStart(6)})  ${grams.toFixed(4)} gCO2e  ${grade.padStart(2)}  ${route.name}`,
  )
}

/** Los archivos que más pesan de una ruta, para saber qué recortar. */
export function heaviestLines(result: RouteResult, count: number): string[] {
  const sorted = [...result.resources].sort((a, b) => b.bytes - a.bytes).slice(0, count)
  return sorted.map(({ url, bytes, origin }) => `     ${kilobytes(bytes).padStart(7)} kB  ${origin === 'service-worker' ? 'sw ' : '   '}${url}`)
}
