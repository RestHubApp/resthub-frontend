// Junta los resúmenes de axe, Lighthouse y WAVE en `reportes/resumen.md` (el
// único reporte que se versiona) y `reportes/resumen.json`, con la matriz de
// cobertura (ruta u overlay por herramienta) y el cumplimiento de las metas.
import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { escribirJson, filtrarVistas, leerJson, REPORTES } from './comun.mjs'
import { ESTADOS, RUTAS_DEL_ROUTER } from './inventario.mjs'

const leer = async (ruta) => (existsSync(join(REPORTES, ruta)) ? leerJson(join(REPORTES, ruta)) : { filas: [] })
const axe = await leer('axe/resumen.json')
const axeSinWidget = await leer('axe-sin-widget/resumen.json')
const lh = await leer('lighthouse/resumen.json')
const wave = await leer('wave/resumen.json')

const indice = (filas, k2) => new Map(filas.map((f) => [`${f.id}--${f[k2]}`, f]))
const iAxe = indice(axe.filas, 'vista')
const iWave = indice(wave.filas, 'vista')
const iLh = indice(lh.filas, 'preset')

const META = { lhA11y: 95, lhBp: 95, lhSeoAcceso: 90, lhPerfEscritorio: 90, lhPerfMovil: 80 }
const filasEstado = []
const cobertura = { axe: [0, 0], wave: [0, 0], lighthouse: [0, 0] }
const incumplimientos = []

for (const e of ESTADOS) {
  for (const vista of filtrarVistas(e)) {
    const a = iAxe.get(`${e.id}--${vista}`)
    const w = iWave.get(`${e.id}--${vista}`)
    const l = e.clase === 'ruta' ? iLh.get(`${e.id}--${vista}`) : null
    cobertura.axe[1] += 1
    cobertura.wave[1] += 1
    if (a && !a.error) cobertura.axe[0] += 1
    if (w && !w.error) cobertura.wave[0] += 1
    if (e.clase === 'ruta') {
      cobertura.lighthouse[1] += 1
      if (l && !l.error) cobertura.lighthouse[0] += 1
    }
    filasEstado.push({ id: e.id, nombre: e.nombre, tipo: e.tipo, vista, axe: a, wave: w, lighthouse: l })
    if (a?.porImpacto && (a.porImpacto.critical > 0 || a.porImpacto.serious > 0)) incumplimientos.push(`axe ${e.id} ${vista}: ${a.violaciones.filter((v) => ['critical', 'serious'].includes(v.impacto)).map((v) => v.regla).join(', ')}`)
    if (w?.conteos && (w.conteos.errors > 0 || w.conteos.contrast > 0)) incumplimientos.push(`WAVE ${e.id} ${vista}: ${w.conteos.errors} errors, ${w.conteos.contrast} contrast`)
    if (l?.puntajes) {
      const p = l.puntajes
      const perfMeta = vista === 'escritorio' ? META.lhPerfEscritorio : META.lhPerfMovil
      if (p.accessibility < META.lhA11y) incumplimientos.push(`Lighthouse ${e.id} ${vista}: accessibility ${p.accessibility}`)
      if (p['best-practices'] < META.lhBp) incumplimientos.push(`Lighthouse ${e.id} ${vista}: best-practices ${p['best-practices']}`)
      if (p.performance < perfMeta) incumplimientos.push(`Lighthouse ${e.id} ${vista}: performance ${p.performance} (< ${perfMeta})`)
      if (e.id === 'acceso' && p.seo < META.lhSeoAcceso) incumplimientos.push(`Lighthouse ${e.id} ${vista}: seo ${p.seo}`)
    }
  }
}

// Rutas del router: cada una tiene que estar cubierta por al menos un estado medido.
const rutasRouter = RUTAS_DEL_ROUTER.map((patron) => {
  const estados = ESTADOS.filter((e) => e.clase === 'ruta' && e.patron === patron)
  const medido = (i, k) => estados.some((e) => filtrarVistas(e).every((v) => i.get(`${e.id}--${v}`) && !i.get(`${e.id}--${v}`).error)) && k
  return { patron, estados: estados.map((e) => e.id), axe: Boolean(medido(iAxe, true)), wave: Boolean(medido(iWave, true)), lighthouse: Boolean(medido(iLh, true)) }
})

const pct = ([h, t]) => (t === 0 ? '—' : `${((100 * h) / t).toFixed(1)} %`)
const n = (x) => x ?? '—'
const axeCelda = (a) => (!a ? 'sin medir' : a.error ? 'error' : `${a.porImpacto.critical}/${a.porImpacto.serious}/${a.porImpacto.moderate}/${a.porImpacto.minor}`)
const waveCelda = (w) => (!w ? 'sin medir' : w.error ? 'error' : `${w.conteos.errors}/${w.conteos.contrast}/${w.conteos.alerts}`)
const lhCelda = (l) => (l === null ? 'no aplica' : !l ? 'sin medir' : l.error ? 'error' : `${l.puntajes.accessibility}/${l.puntajes.performance}/${l.puntajes['best-practices']}/${l.puntajes.seo}`)

const md = `# Resumen de accesibilidad — RestHub

Generado por \`pnpm a11y\` (pruebas/accesibilidad/resumen.mjs) el ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}.
Build de producción (\`vite preview\`) y backend local con \`seed_dev\` + \`seed_history\`.

## Cobertura

| Herramienta | Estados medidos | Porcentaje |
|---|---|---|
| axe-core ${axe.filas.find((f) => f.version)?.version ?? ''} (rutas y overlays × escritorio/móvil) | ${cobertura.axe[0]} / ${cobertura.axe[1]} | ${pct(cobertura.axe)} |
| WAVE ${wave.version ?? ''} (rutas y overlays × escritorio/móvil) | ${cobertura.wave[0]} / ${cobertura.wave[1]} | ${pct(cobertura.wave)} |
| Lighthouse ${lh.filas.find((f) => f.version)?.version ?? ''} (rutas × preset escritorio/móvil; no mide modales) | ${cobertura.lighthouse[0]} / ${cobertura.lighthouse[1]} | ${pct(cobertura.lighthouse)} |

Rutas del router cubiertas: axe ${rutasRouter.filter((r) => r.axe).length}/${rutasRouter.length}, WAVE ${rutasRouter.filter((r) => r.wave).length}/${rutasRouter.length}, Lighthouse ${rutasRouter.filter((r) => r.lighthouse).length}/${rutasRouter.length}.

## Metas

${incumplimientos.length === 0 ? 'Todas las metas se cumplen en todos los estados medidos.' : `Incumplimientos (${incumplimientos.length}):\n\n${incumplimientos.map((i) => `- ${i}`).join('\n')}`}

## Resultados por estado

axe: critical/serious/moderate/minor (reglas violadas). WAVE: errors/contrast/alerts. Lighthouse: accessibility/performance/best-practices/seo.

| Estado | Tipo | Vista | axe | WAVE | Lighthouse |
|---|---|---|---|---|---|
${filasEstado.map((f) => `| ${f.nombre} (\`${f.id}\`) | ${f.tipo} | ${f.vista} | ${axeCelda(f.axe)} | ${waveCelda(f.wave)} | ${lhCelda(f.lighthouse)} |`).join('\n')}

## Rutas del router

| Ruta | Estados | axe | WAVE | Lighthouse |
|---|---|---|---|---|
${rutasRouter.map((r) => `| \`${r.patron}\` | ${r.estados.join(', ')} | ${r.axe ? 'sí' : 'no'} | ${r.wave ? 'sí' : 'no'} | ${r.lighthouse ? 'sí' : 'no'} |`).join('\n')}

## Widget Sienna (axe con y sin el widget, rutas)

| Medición | critical | serious | moderate | minor |
|---|---|---|---|---|
${[['Con el widget', axe.filas.filter((f) => f.clase === 'ruta')], ['Sin el widget', axeSinWidget.filas]]
  .map(([t, fs]) => `| ${t} (${fs.length} mediciones) | ${['critical', 'serious', 'moderate', 'minor'].map((i) => fs.reduce((s, f) => s + n(f.porImpacto?.[i] ?? 0), 0)).join(' | ')} |`)
  .join('\n')}
`
await writeFile(join(REPORTES, 'resumen.md'), md)
await escribirJson(join(REPORTES, 'resumen.json'), { cobertura, rutasRouter, incumplimientos, filas: filasEstado.map((f) => ({ id: f.id, vista: f.vista, axe: f.axe?.porImpacto ?? f.axe?.error, wave: f.wave?.conteos ?? f.wave?.error, lighthouse: f.lighthouse?.puntajes ?? f.lighthouse?.error ?? null })) })
console.log(`Cobertura: axe ${pct(cobertura.axe)}, WAVE ${pct(cobertura.wave)}, Lighthouse ${pct(cobertura.lighthouse)}. Incumplimientos: ${incumplimientos.length}`)
for (const i of incumplimientos) console.log(`  - ${i}`)
