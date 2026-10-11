// axe-core sobre cada estado del inventario (rutas y overlays) en escritorio y
// en móvil. Con un modal abierto, axe analiza el documento entero: el diálogo
// y lo que queda detrás (que Radix marca con aria-hidden).
//
// Variables: A11Y_SOLO, A11Y_CLASE, A11Y_VISTAS (ver comun.mjs) y
// A11Y_SIN_WIDGET=1 para medir sin el widget de accesibilidad Sienna (se
// bloquea la descarga de su archivo), que deja los reportes en `axe-sin-widget/`.
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import AxeBuilder from '@axe-core/playwright'

import { openStatus, ensureDir, handlePassword, contextOf, writeJson, filterStatuses, filterViews, launch, REPORTS } from './comun.mjs'

export const LABELS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
export const IMPACTS = ['critical', 'serious', 'moderate', 'minor']

const withoutWidget = Boolean(process.env.A11Y_SIN_WIDGET)
const dir = await ensureDir(join(REPORTS, withoutWidget ? 'axe-sin-widget' : 'axe'))

function summarize(result) {
  const byImpact = Object.fromEntries(IMPACTS.map((i) => [i, 0]))
  const violations = result.violations.map((v) => {
    byImpact[v.impact] += 1
    return {
      regla: v.id,
      impacto: v.impact,
      ayuda: v.help,
      url: v.helpUrl,
      etiquetas: v.tags.filter((t) => t.startsWith('wcag') || t === 'best-practice'),
      nodos: v.nodes.length,
      objetivos: v.nodes.slice(0, 8).map((n) => ({ selector: n.target.join(' '), html: n.html.slice(0, 200), resumen: n.failureSummary?.slice(0, 300) })),
    }
  })
  return {
    porImpacto: byImpact,
    violaciones: violations,
    reglasAprobadas: result.passes.length,
    porRevisar: result.incomplete.map((i) => ({ regla: i.id, nodos: i.nodes.length })),
    version: result.testEngine.version,
  }
}

const rows = []
const browser = await launch()
for (const status of filterStatuses()) {
  for (const vista of filterViews(status)) {
    const context = await browser.newContext(contextOf(vista))
    if (withoutWidget) await context.route(/sienna-accessibility/u, (route) => route.abort())
    try {
      const page = await openStatus(browser, context, status)
      const result = await new AxeBuilder({ page: page }).withTags(LABELS).analyze()
      const row = { id: status.id, nombre: status.nombre, clase: status.clase, tipo: status.tipo, vista, url: page.url(), ...summarize(result) }
      await writeJson(join(dir, `${handlePassword(status, vista)}.json`), row)
      rows.push(row)
      const { critical, serious, moderate, minor } = row.porImpacto
      console.log(`${handlePassword(status, vista).padEnd(40)} crit ${critical} ser ${serious} mod ${moderate} min ${minor}  ${row.violaciones.map((v) => `${v.regla}(${v.nodos})`).join(' ')}`)
    } catch (error) {
      rows.push({ id: status.id, nombre: status.nombre, clase: status.clase, tipo: status.tipo, vista, error: error.message.split('\n')[0] })
      console.log(`${handlePassword(status, vista).padEnd(40)} ERROR ${error.message.split('\n')[0]}`)
    }
    await context.close()
  }
}
await browser.close()

// Resumen: si se midió solo una parte, se combina con lo que ya había.
const { existsSync } = await import('node:fs')
const { readJson } = await import('./comun.mjs')
const routeSummary = join(dir, 'resumen.json')
const previous = existsSync(routeSummary) && (process.env.A11Y_SOLO || process.env.A11Y_CLASE || process.env.A11Y_VISTAS) ? await readJson(routeSummary) : { filas: [] }
const fresh = new Set(rows.map((f) => `${f.id}--${f.vista}`))
const all = [...previous.filas.filter((f) => !fresh.has(`${f.id}--${f.vista}`)), ...rows]
await writeJson(routeSummary, { fecha: new Date().toISOString(), etiquetas: LABELS, sinWidget: withoutWidget, filas: all })

// Reporte HTML legible (se abre y se captura como evidencia).
const escape = (t) => String(t).replace(/[&<>"]/gu, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const totals = Object.fromEntries(IMPACTS.map((i) => [i, all.reduce((s, f) => s + (f.porImpacto?.[i] ?? 0), 0)]))
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>axe-core — RestHub</title>
<style>body{font:14px system-ui,sans-serif;margin:24px;color:#111;background:#fff}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee}.c{color:#b00020;font-weight:700}.s{color:#c2410c;font-weight:700}.ok{color:#166534}</style></head><body>
<h1>axe-core ${escape(all.find((f) => f.version)?.version ?? '')} — ${all.length} estados × vista${withoutWidget ? ' (sin widget Sienna)' : ''}</h1>
<p>Etiquetas: ${LABELS.join(', ')}. Totales de reglas violadas: critical ${totals.critical}, serious ${totals.serious}, moderate ${totals.moderate}, minor ${totals.minor}. Fecha: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}.</p>
<table><thead><tr><th>Estado</th><th>Tipo</th><th>Vista</th><th>Critical</th><th>Serious</th><th>Moderate</th><th>Minor</th><th>Reglas (nodos)</th></tr></thead><tbody>
${all
  .map((f) => `<tr><td>${escape(f.nombre)}<br><small>${escape(f.id)}</small></td><td>${escape(f.tipo)}</td><td>${f.vista}</td>${
    f.error
      ? `<td colspan="5" class="c">No se pudo abrir: ${escape(f.error)}</td>`
      : `${IMPACTS.map((i) => `<td class="${f.porImpacto[i] ? (i === 'critical' ? 'c' : 's') : 'ok'}">${f.porImpacto[i]}</td>`).join('')}<td>${f.violaciones.map((v) => `${escape(v.regla)} (${v.nodos})`).join(', ') || '—'}</td>`
  }</tr>`)
  .join('\n')}
</tbody></table></body></html>`
await writeFile(join(dir, 'reporte.html'), html)
const errors = all.filter((f) => f.error).length
// En el CI (A11Y_ESTRICTO=1) una violación critical o serious, o un estado que
// no se pudo abrir, hace fallar el paso.
if (process.env.A11Y_ESTRICTO && (totals.critical > 0 || totals.serious > 0 || errors > 0)) process.exitCode = 1
console.log(`\naxe: ${all.length} mediciones, ${errors} sin abrir. critical ${totals.critical}, serious ${totals.serious}, moderate ${totals.moderate}, minor ${totals.minor}`)
