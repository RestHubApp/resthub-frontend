// WAVE (WebAIM) sobre cada estado del inventario, en escritorio y en móvil,
// con la extensión oficial cargada en el Chromium de Playwright (wave.mjs).
// Con un modal abierto, WAVE evalúa el documento entero: el diálogo y la
// página que queda detrás.
import { writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { abrirEstado, asegurarDir, clave, escribirJson, filtrarEstados, filtrarVistas, lanzar, leerJson, REPORTES, VISTAS } from './comun.mjs'
import { abrirNavegadorWave, analizarConWave, capturarWave, prepararWave } from './wave.mjs'

const dir = await asegurarDir(join(REPORTES, 'wave'))
const capturas = await asegurarDir(join(dir, 'capturas'))
const { version } = await prepararWave()
const navegadorSesiones = await lanzar()
const filas = []
const estados = filtrarEstados()

for (const vista of Object.keys(VISTAS)) {
  const deLaVista = estados.filter((e) => filtrarVistas(e).includes(vista))
  if (deLaVista.length === 0) continue
  const { width, height, ...resto } = VISTAS[vista]
  const { contexto, cerrar } = await abrirNavegadorWave({ viewport: { width, height }, ...resto })
  for (const estado of deLaVista) {
    let pagina
    let paso = 'abrir'
    try {
      // Un estado que se traba (la extensión no responde) no detiene a los demás.
      const medir = async () => {
        pagina = await abrirEstado(navegadorSesiones, contexto, estado)
        paso = 'analizar'
        const resultado = await analizarConWave(pagina)
        paso = 'capturar'
        await capturarWave(pagina, join(capturas, `${clave(estado, vista)}.png`))
        return resultado
      }
      let limite
      const { conteos, items } = await Promise.race([
        medir(),
        new Promise((_, rechazar) => {
          limite = setTimeout(() => rechazar(new Error(`sin respuesta en 120 s (paso: ${paso})`)), 120_000)
        }),
      ]).finally(() => clearTimeout(limite))
      const fila = { id: estado.id, nombre: estado.nombre, clase: estado.clase, tipo: estado.tipo, vista, url: pagina.url(), conteos, items: items.map(({ xpaths, ...i }) => ({ ...i, xpaths: xpaths.slice(0, 5) })) }
      await escribirJson(join(dir, `${clave(estado, vista)}.json`), fila)
      filas.push(fila)
      const c = conteos
      console.log(`${clave(estado, vista).padEnd(40)} err ${c.errors} contr ${c.contrast} alert ${c.alerts} feat ${c.features} str ${c.structure} aria ${c.aria}  ${items.filter((i) => ['error', 'contrast', 'alert'].includes(i.tipo)).map((i) => `${i.id}(${i.cantidad})`).join(' ')}`)
    } catch (error) {
      filas.push({ id: estado.id, nombre: estado.nombre, clase: estado.clase, tipo: estado.tipo, vista, error: error.message.split('\n')[0] })
      console.log(`${clave(estado, vista).padEnd(40)} ERROR ${error.message.split('\n')[0]}`)
    }
    await Promise.race([pagina?.close().catch(() => undefined), new Promise((r) => setTimeout(r, 10_000))])
    // El paso «sin conexión» corta la red de todo el contexto persistente.
    await contexto.setOffline(false)
  }
  await cerrar()
}
await navegadorSesiones.close()

const rutaResumen = join(dir, 'resumen.json')
const parcial = process.env.A11Y_SOLO || process.env.A11Y_CLASE || process.env.A11Y_VISTAS
const previo = existsSync(rutaResumen) && parcial ? await leerJson(rutaResumen) : { filas: [] }
const nuevas = new Set(filas.map((f) => `${f.id}--${f.vista}`))
const todas = [...previo.filas.filter((f) => !nuevas.has(`${f.id}--${f.vista}`)), ...filas]
await escribirJson(rutaResumen, { fecha: new Date().toISOString(), version, filas: todas })
const suma = (k) => todas.reduce((s, f) => s + (f.conteos?.[k] ?? 0), 0)
await writeFile(join(dir, 'resumen.txt'), `WAVE ${version}: ${todas.length} mediciones; errors ${suma('errors')}, contrast ${suma('contrast')}, alerts ${suma('alerts')}\n`)
console.log(`\nWAVE ${version}: ${todas.length} mediciones, ${todas.filter((f) => f.error).length} sin abrir; errors ${suma('errors')}, contrast ${suma('contrast')}, alerts ${suma('alerts')}`)
