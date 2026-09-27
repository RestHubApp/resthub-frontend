import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BASE_URL, guionDeSesion, lanzar, REPORTES, sesion } from './comun.mjs'

const navegador = await lanzar()
const almacen = await sesion(navegador, 'plataforma')
const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 } })
await contexto.addInitScript(guionDeSesion(almacen))
const pagina = await contexto.newPage()
await pagina.goto(`${BASE_URL}/plataforma/observabilidad`)
await pagina.getByRole('heading', { name: 'Observabilidad' }).waitFor()
const inicial = await pagina.getByRole('button', { name: 'Cargar peticiones' }).count()
await pagina.screenshot({ path: join(REPORTES, 'observabilidad-diferida-antes.png') })
await pagina.getByRole('button', { name: 'Cargar peticiones' }).scrollIntoViewIfNeeded()
await pagina.waitForTimeout(800)
if (await pagina.getByRole('button', { name: 'Cargar peticiones' }).count()) {
  await pagina.getByRole('button', { name: 'Cargar peticiones' }).click()
}
await pagina.getByRole('heading', { name: 'Peticiones' }).waitFor()
const cargada = await pagina.getByRole('heading', { name: 'Peticiones' }).count()
await pagina.screenshot({ path: join(REPORTES, 'observabilidad-diferida-despues.png') })
await pagina.goto(`${BASE_URL}/plataforma/observabilidad#logs`)
await pagina.getByRole('heading', { name: 'Logs' }).waitFor()
const hash = await pagina.getByRole('heading', { name: 'Logs' }).count()
const resultado = { inicial, cargada, hash }
await writeFile(join(REPORTES, 'observabilidad-diferida.json'), `${JSON.stringify(resultado, null, 2)}\n`)
await contexto.close()
await navegador.close()
if (inicial !== 1 || cargada !== 1 || hash !== 1) throw new Error(JSON.stringify(resultado))
console.log(JSON.stringify(resultado))
