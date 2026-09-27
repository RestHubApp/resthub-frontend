import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const reportes = process.env.A11Y_REPORTES ?? 'pruebas/accesibilidad/reportes'
const { filas } = JSON.parse(await readFile(join(reportes, 'lighthouse/resumen.json'), 'utf8'))
const individuales = []
for (const fila of filas) {
  const ruta = join(reportes, 'lighthouse', `${fila.id}--${fila.preset}.report.json`)
  const audit = JSON.parse(await readFile(ruta, 'utf8')).audits
  individuales.push({
    id: fila.id, preset: fila.preset, score: fila.puntajes.performance,
    accesibilidad: fila.puntajes.accessibility, benchmarkIndex: fila.benchmarkIndex,
    carga: fila.cargaMaquina,
    lcpMs: audit['largest-contentful-paint']?.numericValue ?? null,
    tbtMs: audit['total-blocking-time']?.numericValue ?? null,
    cls: audit['cumulative-layout-shift']?.numericValue ?? null,
    jsSinUsarKb: +((audit['unused-javascript']?.details?.overallSavingsBytes ?? 0) / 1024).toFixed(1),
    cssBloqueanteKb: +((audit['render-blocking-insight']?.details?.items ?? []).reduce((s, i) => s + (i.totalBytes ?? 0), 0) / 1024).toFixed(1),
    avisos: fila.avisos,
  })
}
const mediana = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const stats = Object.fromEntries(['escritorio', 'movil'].map((preset) => {
  const subset = individuales.filter((v) => v.preset === preset)
  const meta = preset === 'escritorio' ? 90 : 80
  return [preset, {
    total: subset.length, mediana: mediana(subset.map((v) => v.score)),
    minimo: Math.min(...subset.map((v) => v.score)), maximo: Math.max(...subset.map((v) => v.score)),
    enMeta: subset.filter((v) => v.score >= meta).length,
    a11y100: subset.filter((v) => v.accesibilidad === 100).length,
    cargaMin: Math.min(...subset.flatMap((v) => v.carga.filter((n) => n !== null))),
    cargaMax: Math.max(...subset.flatMap((v) => v.carga.filter((n) => n !== null))),
    benchmarkMin: Math.min(...subset.map((v) => v.benchmarkIndex)),
    benchmarkMax: Math.max(...subset.map((v) => v.benchmarkIndex)),
    invalidas: subset.filter((v) => v.score === 0 || v.accesibilidad === 0).map((v) => v.id),
  }]
}))
const resumen = { fecha: new Date().toISOString(), stats, rutas: individuales }
await writeFile(join(reportes, 'lighthouse-metricas.json'), `${JSON.stringify(resumen, null, 2)}\n`)
console.log(JSON.stringify(stats, null, 2))
