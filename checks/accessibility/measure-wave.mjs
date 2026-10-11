// WAVE (WebAIM) sobre cada estado del inventario, en escritorio y en móvil,
// con la extensión oficial cargada en el Chromium de Playwright (wave.mjs).
// Con un modal abierto, WAVE evalúa el documento entero: el diálogo y la
// página que queda detrás.
import { writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { openStatus, ensureDir, rowKey, writeJson, filterStatuses, filterViews, launch, readJson, REPORTS, VIEWS } from './common.mjs'
import { openBrowserWave, analyzeWithWave, captureWave, prepareWave } from './wave.mjs'

const dir = await ensureDir(join(REPORTS, 'wave'))
const captures = await ensureDir(join(dir, 'capturas'))
const { version } = await prepareWave()
const browserSessions = await launch()
const rows = []
const statuses = filterStatuses()

for (const view of Object.keys(VIEWS)) {
  const viewMatches = statuses.filter((e) => filterViews(e).includes(view))
  if (viewMatches.length === 0) continue
  const { width, height, ...rest } = VIEWS[view]
  const { context, close } = await openBrowserWave({ viewport: { width, height }, ...rest })
  for (const status of viewMatches) {
    let page
    let step = 'abrir'
    try {
      // Un estado que se traba (la extensión no responde) no detiene a los demás.
      const measure = async () => {
        page = await openStatus(browserSessions, context, status)
        step = 'analizar'
        const result = await analyzeWithWave(page)
        step = 'capturar'
        await captureWave(page, join(captures, `${rowKey(status, view)}.png`))
        return result
      }
      let limit
      const { counts, items } = await Promise.race([
        measure(),
        new Promise((_, reject) => {
          limit = setTimeout(() => reject(new Error(`sin respuesta en 120 s (paso: ${step})`)), 120_000)
        }),
      ]).finally(() => clearTimeout(limit))
      const row = { id: status.id, name: status.name, class: status.class, type: status.type, view, url: page.url(), counts, items: items.map(({ xpaths, ...i }) => ({ ...i, xpaths: xpaths.slice(0, 5) })) }
      await writeJson(join(dir, `${rowKey(status, view)}.json`), row)
      rows.push(row)
      const c = counts
      console.log(`${rowKey(status, view).padEnd(40)} err ${c.errors} contr ${c.contrast} alert ${c.alerts} feat ${c.features} str ${c.structure} aria ${c.aria}  ${items.filter((i) => ['error', 'contrast', 'alert'].includes(i.type)).map((i) => `${i.id}(${i.quantity})`).join(' ')}`)
    } catch (error) {
      rows.push({ id: status.id, name: status.name, class: status.class, type: status.type, view, error: error.message.split('\n')[0] })
      console.log(`${rowKey(status, view).padEnd(40)} ERROR ${error.message.split('\n')[0]}`)
    }
    await Promise.race([page?.close().catch(() => undefined), new Promise((r) => setTimeout(r, 10_000))])
    // El paso «sin conexión» corta la red de todo el contexto persistente.
    await context.setOffline(false)
  }
  await close()
}
await browserSessions.close()

const routeSummary = join(dir, 'resumen.json')
const partial = process.env.A11Y_ONLY || process.env.A11Y_CLASS || process.env.A11Y_VIEWS
const previous = existsSync(routeSummary) && partial ? await readJson(routeSummary) : { rows: [] }
const fresh = new Set(rows.map((f) => `${f.id}--${f.view}`))
const all = [...previous.rows.filter((f) => !fresh.has(`${f.id}--${f.view}`)), ...rows]
await writeJson(routeSummary, { date: new Date().toISOString(), version, rows: all })
const sum = (k) => all.reduce((s, f) => s + (f.counts?.[k] ?? 0), 0)
await writeFile(join(dir, 'resumen.txt'), `WAVE ${version}: ${all.length} mediciones; errors ${sum('errors')}, contrast ${sum('contrast')}, alerts ${sum('alerts')}\n`)
console.log(`\nWAVE ${version}: ${all.length} mediciones, ${all.filter((f) => f.error).length} sin abrir; errors ${sum('errors')}, contrast ${sum('contrast')}, alerts ${sum('alerts')}`)
