// Relaciona el manifiesto del build con los costos de Lighthouse sin adivinar
// qué archivos forman parte de la carga inicial. Ejecutar tras vite build --manifest.
import { readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const root = process.cwd()
const manifest = JSON.parse(await readFile(join(root, 'dist/.vite/manifest.json'), 'utf8'))
const files = new Map(Object.values(manifest).map((entryValue) => [entryValue.file, entryValue]))
const entry = Object.values(manifest).find((item) => item.isEntry)
if (!entry) throw new Error('El manifiesto no contiene el archivo inicial')
const load = new Set()
function include(item) {
  if (!item || load.has(item.file)) return
  load.add(item.file)
  for (const dependency of item.imports ?? []) include(manifest[dependency])
}
include(entry)
const summary = []
for (const [file, item] of files) {
  if (!file.endsWith('.js')) continue
  const bytes = await readFile(join(root, 'dist', file))
  summary.push({ file, kb: +(bytes.length / 1024).toFixed(1), gzipKb: +(gzipSync(bytes).length / 1024).toFixed(1), initial: load.has(file), origin: item.src ?? '' })
}
summary.sort((a, b) => b.gzipKb - a.gzipKb)
const lighthouse = {}
for (const route of ['acceso', 'pedidos', 'pedidos-nuevo', 'roles', 'caja', 'panel']) {
  const lhr = JSON.parse(await readFile(join(root, `checks/accessibility/reports/lighthouse/${route}--mobile.report.json`), 'utf8'))
  const audit = lhr.audits
  lighthouse[route] = {
    performance: Math.round(lhr.categories.performance.score * 100),
    benchmarkIndex: lhr.environment.benchmarkIndex,
    lcpMs: audit['largest-contentful-paint']?.numericValue,
    tbtMs: audit['total-blocking-time']?.numericValue,
    unusedJavaScriptBytes: audit['unused-javascript']?.details?.overallSavingsBytes ?? null,
    unusedJavaScript: audit['unused-javascript']?.details?.items?.slice(0, 8).map((i) => ({ url: i.url, wastedBytes: i.wastedBytes })),
    renderBlocking: audit['render-blocking-insight']?.details?.items?.map((i) => ({ url: i.url, wastedMs: i.wastedMs })) ?? [],
    fontDisplay: audit['font-display-insight']?.details?.items?.map((i) => ({ url: i.url, wastedMs: i.wastedMs })) ?? [],
  }
}
const output = process.env.A11Y_DIAGNOSIS ?? join(root, 'checks/accessibility/reports/perf-mobile-initial.json')
const report = { created: new Date().toISOString(), initial: [...load], totalInitialGzipKb: +summary.filter((i) => i.initial).reduce((sum, i) => sum + i.gzipKb, 0).toFixed(1), files: summary, lighthouse }
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(`Entrada: ${report.totalInitialGzipKb} KiB gzip en ${load.size} chunks; reporte ${output}`)
for (const item of summary.filter((i) => i.initial)) console.log(`${item.file}: ${item.gzipKb} KiB gzip`)
