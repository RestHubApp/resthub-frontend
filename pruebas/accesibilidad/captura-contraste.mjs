// Captura, para la evidencia del antes y el después, los elementos que axe
// marcó por contraste: la fila de pestañas del inventario, una insignia verde
// («Pagado») y una amarilla («Bajo mínimo» / pendiente). Uso:
//   node captura-contraste.mjs antes|despues
import { join } from 'node:path'

import { abrirEstado, asegurarDir, contextoDe, lanzar, REPORTES } from './comun.mjs'
import { ESTADOS } from './inventario.mjs'

const etapa = process.argv[2] ?? 'despues'
const dir = await asegurarDir(join(REPORTES, 'contraste'))
const navegador = await lanzar()
const casos = [
  { id: 'inventario', selector: '[role="tablist"]', nombre: 'pestanas' },
  { id: 'pedido-cobrado', selector: 'main .bg-success\\/10, main [class*="text-success"]', nombre: 'exito' },
  { id: 'pedidos-encargado', selector: 'main [class*="text-warning"]', nombre: 'aviso' },
]
for (const caso of casos) {
  const contexto = await navegador.newContext({ ...contextoDe('escritorio'), deviceScaleFactor: 2 })
  const pagina = await abrirEstado(navegador, contexto, ESTADOS.find((e) => e.id === caso.id))
  const elemento = pagina.locator(caso.selector).first()
  const colores = await elemento.evaluate((e) => {
    const s = getComputedStyle(e)
    return { color: s.color, fondo: s.backgroundColor }
  })
  const caja = await elemento.boundingBox()
  const margen = 24
  await pagina.screenshot({
    path: join(dir, `${caso.nombre}-${etapa}.png`),
    clip: { x: Math.max(0, caja.x - margen), y: Math.max(0, caja.y - margen), width: Math.min(900, caja.width + 2 * margen), height: caja.height + 2 * margen },
  })
  console.log(caso.nombre, etapa, colores)
  await contexto.close()
}
await navegador.close()
