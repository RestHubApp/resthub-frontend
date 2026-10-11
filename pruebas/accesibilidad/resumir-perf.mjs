import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const reports = process.env.A11Y_REPORTES ?? 'pruebas/accesibilidad/reportes'
const { filas: rows } = JSON.parse(await readFile(join(reports, 'lighthouse/resumen.json'), 'utf8'))
const individual = []
for (const row of rows) {
  const route = join(reports, 'lighthouse', `${row.id}--${row.preset}.report.json`)
  const audit = JSON.parse(await readFile(route, 'utf8')).audits
  individual.push({
    id: row.id, preset: row.preset, score: row.puntajes.performance,
    accessibility: row.puntajes.accessibility, benchmarkIndex: row.benchmarkIndex,
    load: row.cargaMaquina,
    lcpMs: audit['largest-contentful-paint']?.numericValue ?? null,
    tbtMs: audit['total-blocking-time']?.numericValue ?? null,
    cls: audit['cumulative-layout-shift']?.numericValue ?? null,
    jsWithoutUseKb: +((audit['unused-javascript']?.details?.overallSavingsBytes ?? 0) / 1024).toFixed(1),
    cssBlockingKb: +((audit['render-blocking-insight']?.details?.items ?? []).reduce((s, i) => s + (i.totalBytes ?? 0), 0) / 1024).toFixed(1),
    notices: row.avisos,
  })
}
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const stats = Object.fromEntries(['escritorio', 'movil'].map((preset) => {
  const subset = individual.filter((v) => v.preset === preset)
  const meta = preset === 'escritorio' ? 90 : 80
  return [preset, {
    total: subset.length, median: median(subset.map((v) => v.score)),
    min: Math.min(...subset.map((v) => v.score)), max: Math.max(...subset.map((v) => v.score)),
    enMeta: subset.filter((v) => v.score >= meta).length,
    a11y100: subset.filter((v) => v.accesibilidad === 100).length,
    loadMin: Math.min(...subset.flatMap((v) => v.carga.filter((n) => n !== null))),
    loadMax: Math.max(...subset.flatMap((v) => v.carga.filter((n) => n !== null))),
    benchmarkMin: Math.min(...subset.map((v) => v.benchmarkIndex)),
    benchmarkMax: Math.max(...subset.map((v) => v.benchmarkIndex)),
    invalid: subset.filter((v) => v.score === 0 || v.accesibilidad === 0).map((v) => v.id),
  }]
}))
const summary = { date: new Date().toISOString(), stats, routes: individual }
await writeFile(join(reports, 'lighthouse-metricas.json'), `${JSON.stringify(summary, null, 2)}\n`)
console.log(JSON.stringify(stats, null, 2))
