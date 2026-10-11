import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BASE_URL, sessionScript, launch, REPORTS, session } from './common.mjs'

const browser = await launch()
const storage = await session(browser, 'platform')
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
await context.addInitScript(sessionScript(storage))
const page = await context.newPage()
await page.goto(`${BASE_URL}/plataforma/observabilidad`)
await page.getByRole('heading', { name: 'Observabilidad' }).waitFor()
const initial = await page.getByRole('button', { name: 'Cargar peticiones' }).count()
await page.screenshot({ path: join(REPORTS, 'observabilidad-diferida-antes.png') })
await page.getByRole('button', { name: 'Cargar peticiones' }).scrollIntoViewIfNeeded()
await page.waitForTimeout(800)
if (await page.getByRole('button', { name: 'Cargar peticiones' }).count()) {
  await page.getByRole('button', { name: 'Cargar peticiones' }).click()
}
await page.getByRole('heading', { name: 'Peticiones' }).waitFor()
const loaded = await page.getByRole('heading', { name: 'Peticiones' }).count()
await page.screenshot({ path: join(REPORTS, 'observabilidad-diferida-despues.png') })
await page.goto(`${BASE_URL}/plataforma/observabilidad#logs`)
await page.getByRole('heading', { name: 'Logs' }).waitFor()
const hash = await page.getByRole('heading', { name: 'Logs' }).count()
const result = { initial, loaded, hash }
await writeFile(join(REPORTS, 'observabilidad-diferida.json'), `${JSON.stringify(result, null, 2)}\n`)
await context.close()
await browser.close()
if (initial !== 1 || loaded !== 1 || hash !== 1) throw new Error(JSON.stringify(result))
console.log(JSON.stringify(result))
