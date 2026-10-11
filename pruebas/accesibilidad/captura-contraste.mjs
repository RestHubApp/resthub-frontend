// Captura, para la evidencia del antes y el después, los elementos que axe
// marcó por contraste: la fila de pestañas del inventario, una insignia verde
// («Pagado») y una amarilla («Bajo mínimo» / pendiente). Uso:
//   node captura-contraste.mjs antes|despues
import { join } from 'node:path'

import { openStatus, ensureDir, contextOf, launch, REPORTS } from './comun.mjs'
import { STATUSES } from './inventario.mjs'

const stage = process.argv[2] ?? 'despues'
const dir = await ensureDir(join(REPORTS, 'contraste'))
const browser = await launch()
const cases = [
  { id: 'inventario', selector: '[role="tablist"]', nombre: 'pestanas' },
  { id: 'pedido-cobrado', selector: 'main .bg-success\\/10, main [class*="text-success"]', nombre: 'exito' },
  { id: 'pedidos-encargado', selector: 'main [class*="text-warning"]', nombre: 'aviso' },
]
for (const caseValue of cases) {
  const context = await browser.newContext({ ...contextOf('escritorio'), deviceScaleFactor: 2 })
  const page = await openStatus(browser, context, STATUSES.find((e) => e.id === caseValue.id))
  const element = page.locator(caseValue.selector).first()
  const colors = await element.evaluate((e) => {
    const s = getComputedStyle(e)
    return { color: s.color, fondo: s.backgroundColor }
  })
  const cashRegister = await element.boundingBox()
  const margin = 24
  await page.screenshot({
    path: join(dir, `${caseValue.nombre}-${stage}.png`),
    clip: { x: Math.max(0, cashRegister.x - margin), y: Math.max(0, cashRegister.y - margin), width: Math.min(900, cashRegister.width + 2 * margin), height: cashRegister.height + 2 * margin },
  })
  console.log(caseValue.nombre, stage, colors)
  await context.close()
}
await browser.close()
