import { abrirComo, expect, test } from './soporte/fixtures'

test('humo: el mesero ve sus mesas @movil', async ({ page, local }) => {
  await abrirComo(page, local.mesero, '/pedidos')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.screenshot({ path: 'e2e/.resultados/humo.png' })
})
