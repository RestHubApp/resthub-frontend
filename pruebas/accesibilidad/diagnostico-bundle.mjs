// Relaciona el manifiesto del build con los costos de Lighthouse sin adivinar
// qué archivos forman parte de la carga inicial. Ejecutar tras vite build --manifest.
import { readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'

const raiz = process.cwd()
const manifiesto = JSON.parse(await readFile(join(raiz, 'dist/.vite/manifest.json'), 'utf8'))
const archivos = new Map(Object.values(manifiesto).map((entrada) => [entrada.file, entrada]))
const entry = Object.values(manifiesto).find((item) => item.isEntry)
if (!entry) throw new Error('El manifiesto no contiene el archivo inicial')
const carga = new Set()
function incluir(item) {
  if (!item || carga.has(item.file)) return
  carga.add(item.file)
  for (const dependency of item.imports ?? []) incluir(manifiesto[dependency])
}
incluir(entry)
const resumen = []
for (const [file, item] of archivos) {
  if (!file.endsWith('.js')) continue
  const bytes = await readFile(join(raiz, 'dist', file))
  resumen.push({ file, kb: +(bytes.length / 1024).toFixed(1), gzipKb: +(gzipSync(bytes).length / 1024).toFixed(1), inicial: carga.has(file), origen: item.src ?? '' })
}
resumen.sort((a, b) => b.gzipKb - a.gzipKb)
const lighthouse = {}
for (const ruta of ['acceso', 'pedidos', 'pedidos-nuevo', 'roles', 'caja', 'panel']) {
  const lhr = JSON.parse(await readFile(join(raiz, `pruebas/accesibilidad/reportes/lighthouse/${ruta}--movil.report.json`), 'utf8'))
  const audit = lhr.audits
  lighthouse[ruta] = {
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
const salida = process.env.A11Y_DIAGNOSTICO ?? join(raiz, 'pruebas/accesibilidad/reportes/perf-movil-inicial.json')
const informe = { creado: new Date().toISOString(), inicial: [...carga], totalInicialGzipKb: +resumen.filter((i) => i.inicial).reduce((sum, i) => sum + i.gzipKb, 0).toFixed(1), archivos: resumen, lighthouse }
await writeFile(salida, `${JSON.stringify(informe, null, 2)}\n`)
console.log(`Entrada: ${informe.totalInicialGzipKb} KiB gzip en ${carga.size} chunks; reporte ${salida}`)
for (const item of resumen.filter((i) => i.inicial)) console.log(`${item.file}: ${item.gzipKb} KiB gzip`)
