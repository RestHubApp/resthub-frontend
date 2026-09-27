// Regresión visual del panel BI: indicadores con ventas del día, reposición
// sugerida y la auditoría de la IA.
import { vender } from '../soporte/gestion'
import { cubre } from '../soporte/cobertura'
import { abrirComo } from '../soporte/fixtures'
import { capturar, expect, plazo, test } from './captura'

test('VIS-11 los indicadores del panel, la reposición y la auditoría de IA', async ({ page, localConCaja }) => {
  plazo(120_000)
  cubre('ruta:/panel', 'ruta:/panel/reposicion', 'ruta:/panel/ia')
  const local = localConCaja
  await vender(local, { mesa: local.mesa('1'), items: [{ plato: local.plato('Lomo saltado'), cantidad: 2 }] })
  await vender(local, {
    mesa: local.mesa('2'),
    items: [{ plato: local.plato('Ceviche clásico') }, { plato: local.plato('Chicha morada'), cantidad: 2 }],
    metodo: 'yape',
  })

  await abrirComo(page, local.encargado, '/panel')
  const indicadores = page.getByRole('region', { name: 'Indicadores del período' })
  await expect(indicadores.getByText('S/ 108.00')).toBeVisible()
  await expect(page.getByRole('table', { name: /Margen por plato/u })).toBeVisible()
  // Los ejes de las series salen de las fechas del período, y el mapa por hora
  // de la hora real de los cobros: cambian cada día.
  await capturar(page, 'panel-indicadores', {
    mask: [
      page.getByRole('img', { name: /^Ventas por día/u }),
      page.getByRole('region', { name: 'Período', exact: true }).getByRole('paragraph'),
      // El anillo de la hora pico sobresale del mapa: se enmascara su contenedor.
      page.getByRole('img', { name: /^Mapa de calor de pedidos/u }).locator('..'),
      page.getByText(/^Hora pico:/u),
    ],
  })

  const secciones = page.getByRole('navigation', { name: 'Secciones del panel' })
  await secciones.getByRole('link', { name: 'Reposición' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Culantro' })).toBeVisible()
  await capturar(page, 'panel-reposicion')

  await secciones.getByRole('link', { name: 'Auditoría de IA' }).click()
  await expect(page.getByRole('heading', { name: 'Decisiones' })).toBeVisible()
  await expect(page.getByText(/en total con estos filtros/u)).toBeVisible()
  await capturar(page, 'panel-auditoria-ia')
})
