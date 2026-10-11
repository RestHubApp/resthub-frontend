// Abre cada estado del inventario y comprueba que se puede alcanzar; guarda una
// captura de cada uno en reportes/estados/. No mide nada: sirve para revisar el
// inventario antes de las mediciones.
import { join } from 'node:path'
import { openStatus, ensureDir, handlePassword, contextOf, writeJson, filterStatuses, filterViews, launch, REPORTS } from './common.mjs'

const dir = await ensureDir(join(REPORTS, 'estados'))
const browser = await launch()
const result = []
for (const status of filterStatuses()) {
  for (const vista of filterViews(status)) {
    const context = await browser.newContext(contextOf(vista))
    const start = Date.now()
    try {
      const page = await openStatus(browser, context, status)
      await page.screenshot({ path: join(dir, `${handlePassword(status, vista)}.png`) })
      result.push({ id: status.id, vista, ok: true, url: page.url(), ms: Date.now() - start })
      console.log('ok ', handlePassword(status, vista), new URL(page.url()).pathname)
    } catch (error) {
      result.push({ id: status.id, vista, ok: false, error: error.message.split('\n')[0] })
      console.log('ERR', handlePassword(status, vista), error.message.split('\n')[0])
    }
    await context.close()
  }
}
await browser.close()
await writeJson(join(dir, 'estados.json'), result)
console.log(`${result.filter((r) => r.ok).length}/${result.length} estados alcanzados`)
