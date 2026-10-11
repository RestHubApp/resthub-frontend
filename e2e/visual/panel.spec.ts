// Regresión visual del panel BI: indicadores con ventas del día, reposición
// sugerida y la auditoría de la IA.
import { sell } from '../support/management'
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { capture, expect, deadline, test } from './capture'

test('VIS-11 los indicadores del panel, la reposición y la auditoría de IA', async ({ page, restaurantWithCashRegister }) => {
  deadline(120_000)
  covers('ruta:/panel', 'ruta:/panel/reposicion', 'ruta:/panel/ia')
  const local = restaurantWithCashRegister
  await sell(local, { table: local.table('1'), items: [{ dish: local.dish('Lomo saltado'), quantity: 2 }] })
  await sell(local, {
    table: local.table('2'),
    items: [{ dish: local.dish('Ceviche clásico') }, { dish: local.dish('Chicha morada'), quantity: 2 }],
    method: 'yape',
  })

  await openAs(page, local.owner, '/panel')
  const indicators = page.getByRole('region', { name: 'Indicadores del período' })
  await expect(indicators.getByText('S/ 108.00')).toBeVisible()
  await expect(page.getByRole('table', { name: /Margen por plato/u })).toBeVisible()
  // Los ejes de las series salen de las fechas del período, y el mapa por hora
  // de la hora real de los cobros: cambian cada día.
  await capture(page, 'panel-indicadores', {
    mask: [
      page.getByRole('img', { name: /^Ventas por día/u }),
      page.getByRole('region', { name: 'Período', exact: true }).getByRole('paragraph'),
      // El anillo de la hora pico sobresale del mapa: se enmascara su contenedor.
      page.getByRole('img', { name: /^Mapa de calor de pedidos/u }).locator('..'),
      page.getByText(/^Hora pico:/u),
    ],
  })

  const sections = page.getByRole('navigation', { name: 'Secciones del panel' })
  await sections.getByRole('link', { name: 'Reposición' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Culantro' })).toBeVisible()
  await capture(page, 'panel-reposicion')

  await sections.getByRole('link', { name: 'Auditoría de IA' }).click()
  await expect(page.getByRole('heading', { name: 'Decisiones' })).toBeVisible()
  await expect(page.getByText(/en total con estos filtros/u)).toBeVisible()
  await capture(page, 'panel-auditoria-ia')
})
