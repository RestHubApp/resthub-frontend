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

import { abrirEstado, asegurarDir, clave, contextoDe, escribirJson, filtrarEstados, filtrarVistas, lanzar, REPORTES } from './comun.mjs'

export const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
export const IMPACTOS = ['critical', 'serious', 'moderate', 'minor']

const sinWidget = Boolean(process.env.A11Y_SIN_WIDGET)
const dir = await asegurarDir(join(REPORTES, sinWidget ? 'axe-sin-widget' : 'axe'))

function resumir(resultado) {
  const porImpacto = Object.fromEntries(IMPACTOS.map((i) => [i, 0]))
  const violaciones = resultado.violations.map((v) => {
    porImpacto[v.impact] += 1
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
    porImpacto,
    violaciones,
    reglasAprobadas: resultado.passes.length,
    porRevisar: resultado.incomplete.map((i) => ({ regla: i.id, nodos: i.nodes.length })),
    version: resultado.testEngine.version,
  }
}

const filas = []
const navegador = await lanzar()
for (const estado of filtrarEstados()) {
  for (const vista of filtrarVistas(estado)) {
    const contexto = await navegador.newContext(contextoDe(vista))
    if (sinWidget) await contexto.route(/sienna-accessibility/u, (ruta) => ruta.abort())
    try {
      const pagina = await abrirEstado(navegador, contexto, estado)
      const resultado = await new AxeBuilder({ page: pagina }).withTags(ETIQUETAS).analyze()
      const fila = { id: estado.id, nombre: estado.nombre, clase: estado.clase, tipo: estado.tipo, vista, url: pagina.url(), ...resumir(resultado) }
      await escribirJson(join(dir, `${clave(estado, vista)}.json`), fila)
      filas.push(fila)
      const { critical, serious, moderate, minor } = fila.porImpacto
      console.log(`${clave(estado, vista).padEnd(40)} crit ${critical} ser ${serious} mod ${moderate} min ${minor}  ${fila.violaciones.map((v) => `${v.regla}(${v.nodos})`).join(' ')}`)
    } catch (error) {
      filas.push({ id: estado.id, nombre: estado.nombre, clase: estado.clase, tipo: estado.tipo, vista, error: error.message.split('\n')[0] })
      console.log(`${clave(estado, vista).padEnd(40)} ERROR ${error.message.split('\n')[0]}`)
    }
    await contexto.close()
  }
}
await navegador.close()

// Resumen: si se midió solo una parte, se combina con lo que ya había.
const { existsSync } = await import('node:fs')
const { leerJson } = await import('./comun.mjs')
const rutaResumen = join(dir, 'resumen.json')
const previo = existsSync(rutaResumen) && (process.env.A11Y_SOLO || process.env.A11Y_CLASE || process.env.A11Y_VISTAS) ? await leerJson(rutaResumen) : { filas: [] }
const nuevas = new Set(filas.map((f) => `${f.id}--${f.vista}`))
const todas = [...previo.filas.filter((f) => !nuevas.has(`${f.id}--${f.vista}`)), ...filas]
await escribirJson(rutaResumen, { fecha: new Date().toISOString(), etiquetas: ETIQUETAS, sinWidget, filas: todas })

// Reporte HTML legible (se abre y se captura como evidencia).
const escapar = (t) => String(t).replace(/[&<>"]/gu, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const totales = Object.fromEntries(IMPACTOS.map((i) => [i, todas.reduce((s, f) => s + (f.porImpacto?.[i] ?? 0), 0)]))
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>axe-core — RestHub</title>
<style>body{font:14px system-ui,sans-serif;margin:24px;color:#111;background:#fff}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;vertical-align:top}th{background:#eee}.c{color:#b00020;font-weight:700}.s{color:#c2410c;font-weight:700}.ok{color:#166534}</style></head><body>
<h1>axe-core ${escapar(todas.find((f) => f.version)?.version ?? '')} — ${todas.length} estados × vista${sinWidget ? ' (sin widget Sienna)' : ''}</h1>
<p>Etiquetas: ${ETIQUETAS.join(', ')}. Totales de reglas violadas: critical ${totales.critical}, serious ${totales.serious}, moderate ${totales.moderate}, minor ${totales.minor}. Fecha: ${new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}.</p>
<table><thead><tr><th>Estado</th><th>Tipo</th><th>Vista</th><th>Critical</th><th>Serious</th><th>Moderate</th><th>Minor</th><th>Reglas (nodos)</th></tr></thead><tbody>
${todas
  .map((f) => `<tr><td>${escapar(f.nombre)}<br><small>${escapar(f.id)}</small></td><td>${escapar(f.tipo)}</td><td>${f.vista}</td>${
    f.error
      ? `<td colspan="5" class="c">No se pudo abrir: ${escapar(f.error)}</td>`
      : `${IMPACTOS.map((i) => `<td class="${f.porImpacto[i] ? (i === 'critical' ? 'c' : 's') : 'ok'}">${f.porImpacto[i]}</td>`).join('')}<td>${f.violaciones.map((v) => `${escapar(v.regla)} (${v.nodos})`).join(', ') || '—'}</td>`
  }</tr>`)
  .join('\n')}
</tbody></table></body></html>`
await writeFile(join(dir, 'reporte.html'), html)
const errores = todas.filter((f) => f.error).length
// En el CI (A11Y_ESTRICTO=1) una violación critical o serious, o un estado que
// no se pudo abrir, hace fallar el paso.
if (process.env.A11Y_ESTRICTO && (totales.critical > 0 || totales.serious > 0 || errores > 0)) process.exitCode = 1
console.log(`\naxe: ${todas.length} mediciones, ${errores} sin abrir. critical ${totales.critical}, serious ${totales.serious}, moderate ${totales.moderate}, minor ${totales.minor}`)
