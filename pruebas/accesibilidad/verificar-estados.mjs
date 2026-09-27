// Abre cada estado del inventario y comprueba que se puede alcanzar; guarda una
// captura de cada uno en reportes/estados/. No mide nada: sirve para revisar el
// inventario antes de las mediciones.
import { join } from 'node:path'
import { abrirEstado, asegurarDir, clave, contextoDe, escribirJson, filtrarEstados, filtrarVistas, lanzar, REPORTES } from './comun.mjs'

const dir = await asegurarDir(join(REPORTES, 'estados'))
const navegador = await lanzar()
const resultado = []
for (const estado of filtrarEstados()) {
  for (const vista of filtrarVistas(estado)) {
    const contexto = await navegador.newContext(contextoDe(vista))
    const inicio = Date.now()
    try {
      const pagina = await abrirEstado(navegador, contexto, estado)
      await pagina.screenshot({ path: join(dir, `${clave(estado, vista)}.png`) })
      resultado.push({ id: estado.id, vista, ok: true, url: pagina.url(), ms: Date.now() - inicio })
      console.log('ok ', clave(estado, vista), new URL(pagina.url()).pathname)
    } catch (error) {
      resultado.push({ id: estado.id, vista, ok: false, error: error.message.split('\n')[0] })
      console.log('ERR', clave(estado, vista), error.message.split('\n')[0])
    }
    await contexto.close()
  }
}
await navegador.close()
await escribirJson(join(dir, 'estados.json'), resultado)
console.log(`${resultado.filter((r) => r.ok).length}/${resultado.length} estados alcanzados`)
