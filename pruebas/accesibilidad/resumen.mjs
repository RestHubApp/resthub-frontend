// Junta los resúmenes de axe, Lighthouse y WAVE en `reportes/resumen.md` (el
// único reporte que se versiona) y `reportes/resumen.json`, con la matriz de
// cobertura (ruta u overlay por herramienta) y el cumplimiento de las metas.
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { writeJson, filterViews, readJson, REPORTS } from './comun.mjs'
import { STATUSES, ROUTER_ROUTES } from './inventario.mjs'

const read = async (route) => (existsSync(join(REPORTS, route)) ? readJson(join(REPORTS, route)) : { rows: [] })
const axe = await read('axe/resumen.json')
const axeWithoutWidget = await read('axe-sin-widget/resumen.json')
const lh = await read('lighthouse/resumen.json')
const wave = await read('wave/resumen.json')

const index = (rows, k2) => new Map(rows.map((f) => [`${f.id}--${f[k2]}`, f]))
const iAxe = index(axe.filas, 'vista')
const iWave = index(wave.filas, 'vista')
const iLh = index(lh.filas, 'preset')

const META = { lhA11y: 95, lhBp: 95, lhSeoAccess: 90, lhPerfDesktop: 90, lhPerfMovil: 80, lhPerfMovilManagement: 70 }
// El celular es del mesero y de cocina, y de quien aún no entró: 80. El
// encargado y la plataforma trabajan en laptop; en el celular se les pide 70.
const MOBILE_ACCOUNTS = new Set([null, undefined, 'mesero', 'cocina', 'sin-terminos'])
const rowsStatus = []
const coverage = { axe: [0, 0], wave: [0, 0], lighthouse: [0, 0] }
const violations = []

for (const e of STATUSES) {
  for (const vista of filterViews(e)) {
    const a = iAxe.get(`${e.id}--${vista}`)
    const w = iWave.get(`${e.id}--${vista}`)
    const l = e.class === 'ruta' ? iLh.get(`${e.id}--${vista}`) : null
    coverage.axe[1] += 1
    coverage.wave[1] += 1
    if (a && !a.error) coverage.axe[0] += 1
    if (w && !w.error) coverage.wave[0] += 1
    if (e.class === 'ruta') {
      coverage.lighthouse[1] += 1
      if (l && !l.error) coverage.lighthouse[0] += 1
    }
    rowsStatus.push({ id: e.id, name: e.name, type: e.type, vista, axe: a, wave: w, lighthouse: l })
    if (a?.porImpacto && (a.porImpacto.critical > 0 || a.porImpacto.serious > 0)) violations.push(`axe ${e.id} ${vista}: ${a.violaciones.filter((v) => ['critical', 'serious'].includes(v.impacto)).map((v) => v.regla).join(', ')}`)
    if (w?.conteos && (w.conteos.errors > 0 || w.conteos.contrast > 0)) violations.push(`WAVE ${e.id} ${vista}: ${w.conteos.errors} errors, ${w.conteos.contrast} contrast`)
    if (l?.puntajes) {
      const p = l.puntajes
      const perfMeta = vista === 'escritorio' ? META.lhPerfDesktop : MOBILE_ACCOUNTS.has(e.account) ? META.lhPerfMovil : META.lhPerfMovilManagement
      if (p.accessibility < META.lhA11y) violations.push(`Lighthouse ${e.id} ${vista}: accessibility ${p.accessibility}`)
      if (p['best-practices'] < META.lhBp) violations.push(`Lighthouse ${e.id} ${vista}: best-practices ${p['best-practices']}`)
      if (p.performance < perfMeta) violations.push(`Lighthouse ${e.id} ${vista}: performance ${p.performance} (< ${perfMeta})`)
      if (e.id === 'acceso' && p.seo < META.lhSeoAccess) violations.push(`Lighthouse ${e.id} ${vista}: seo ${p.seo}`)
    }
  }
}

// Rutas del router: cada una tiene que estar cubierta por al menos un estado medido.
const routesRouter = ROUTER_ROUTES.map((patron) => {
  const statuses = STATUSES.filter((e) => e.class === 'ruta' && e.patron === patron)
  const measured = (i, k) => statuses.some((e) => filterViews(e).every((v) => i.get(`${e.id}--${v}`) && !i.get(`${e.id}--${v}`).error)) && k
  return { patron, statuses: statuses.map((e) => e.id), axe: Boolean(measured(iAxe, true)), wave: Boolean(measured(iWave, true)), lighthouse: Boolean(measured(iLh, true)) }
})

const pct = ([h, t]) => (t === 0 ? '—' : `${((100 * h) / t).toFixed(1)} %`)
const n = (x) => x ?? '—'
const axeCell = (a) => (!a ? 'sin medir' : a.error ? 'error' : `${a.porImpacto.critical}/${a.porImpacto.serious}/${a.porImpacto.moderate}/${a.porImpacto.minor}`)
const waveCell = (w) => (!w ? 'sin medir' : w.error ? 'error' : `${w.conteos.errors}/${w.conteos.contrast}/${w.conteos.alerts}`)
const lhCell = (l) => (l === null ? 'no aplica' : !l ? 'sin medir' : l.error ? 'error' : `${l.puntajes.accessibility}/${l.puntajes.performance}/${l.puntajes['best-practices']}/${l.puntajes.seo}`)

const md = `# Resumen de accesibilidad — RestHub

Generado por \`pnpm a11y\` (pruebas/accesibilidad/resumen.mjs) el ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}.
Build de producción (\`vite preview\`) y backend local con \`seed_dev\` + \`seed_history\`.

## Cobertura

| Herramienta | Estados medidos | Porcentaje |
|---|---|---|
| axe-core ${axe.filas.find((f) => f.version)?.version ?? ''} (rutas y overlays × escritorio/móvil) | ${coverage.axe[0]} / ${coverage.axe[1]} | ${pct(coverage.axe)} |
| WAVE ${wave.version ?? ''} (rutas y overlays × escritorio/móvil) | ${coverage.wave[0]} / ${coverage.wave[1]} | ${pct(coverage.wave)} |
| Lighthouse ${lh.filas.find((f) => f.version)?.version ?? ''} (rutas × preset escritorio/móvil; no mide modales) | ${coverage.lighthouse[0]} / ${coverage.lighthouse[1]} | ${pct(coverage.lighthouse)} |

Rutas del router cubiertas: axe ${routesRouter.filter((r) => r.axe).length}/${routesRouter.length}, WAVE ${routesRouter.filter((r) => r.wave).length}/${routesRouter.length}, Lighthouse ${routesRouter.filter((r) => r.lighthouse).length}/${routesRouter.length}.

## Metas

${violations.length === 0 ? 'Todas las metas se cumplen en todos los estados medidos.' : `Incumplimientos (${violations.length}):\n\n${violations.map((i) => `- ${i}`).join('\n')}`}

## Resultados por estado

axe: critical/serious/moderate/minor (reglas violadas). WAVE: errors/contrast/alerts. Lighthouse: accessibility/performance/best-practices/seo.

| Estado | Tipo | Vista | axe | WAVE | Lighthouse |
|---|---|---|---|---|---|
${rowsStatus.map((f) => `| ${f.name} (\`${f.id}\`) | ${f.type} | ${f.vista} | ${axeCell(f.axe)} | ${waveCell(f.wave)} | ${lhCell(f.lighthouse)} |`).join('\n')}

## Rutas del router

| Ruta | Estados | axe | WAVE | Lighthouse |
|---|---|---|---|---|
${routesRouter.map((r) => `| \`${r.patron}\` | ${r.statuses.join(', ')} | ${r.axe ? 'sí' : 'no'} | ${r.wave ? 'sí' : 'no'} | ${r.lighthouse ? 'sí' : 'no'} |`).join('\n')}

## Widget Sienna (axe con y sin el widget, rutas)

| Medición | critical | serious | moderate | minor |
|---|---|---|---|---|
${[['Con el widget', axe.filas.filter((f) => f.clase === 'ruta')], ['Sin el widget', axeWithoutWidget.filas]]
  .map(([t, fs]) => `| ${t} (${fs.length} mediciones) | ${['critical', 'serious', 'moderate', 'minor'].map((i) => fs.reduce((s, f) => s + n(f.porImpacto?.[i] ?? 0), 0)).join(' | ')} |`)
  .join('\n')}
`
await writeFile(join(REPORTS, 'resumen.md'), md)
await writeJson(join(REPORTS, 'resumen.json'), { coverage, routesRouter, violations, rows: rowsStatus.map((f) => ({ id: f.id, vista: f.vista, axe: f.axe?.porImpacto ?? f.axe?.error, wave: f.wave?.conteos ?? f.wave?.error, lighthouse: f.lighthouse?.puntajes ?? f.lighthouse?.error ?? null })) })
console.log(`Cobertura: axe ${pct(coverage.axe)}, WAVE ${pct(coverage.wave)}, Lighthouse ${pct(coverage.lighthouse)}. Incumplimientos: ${violations.length}`)
for (const i of violations) console.log(`  - ${i}`)
