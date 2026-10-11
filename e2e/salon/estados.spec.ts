// Los estados vacíos y de error de cada pantalla del salón, la cocina y el
// tablero. Un error se provoca respondiendo 500 a esa lectura; «Reintentar»
// la vuelve a pedir y la pantalla se recupera sin recargar.
import type { Page } from '@playwright/test'

import { covers } from '../soporte/cobertura'
import { openAs, evidence, expect, test } from '../soporte/fixtures'
import { api, orderInTable } from '../soporte/salon'

/** Hace fallar con 500 las lecturas a esa ruta exacta del API; devuelve cómo dejar de fallar. */
async function fail(page: Page, route: string): Promise<() => Promise<void>> {
  const coincide = (url: URL) => url.pathname === `/api/v1${route}`
  await page.route(coincide, async (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
  return async () => {
    await page.unroute(coincide)
  }
}

// Un aviso por falla: el de la pantalla, sin el de respaldo del armazón
// (los localizadores por rol no ven lo oculto, así que dos avisos visibles
// harían fallar el modo estricto).
async function retry(page: Page, healthy: () => Promise<void>): Promise<void> {
  await expect(page.getByRole('alert')).toHaveCount(1)
  await healthy()
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toHaveCount(0)
}

test('SAL-31 sin mesas activas ni pedidos, cada pestaña del mesero lo dice @movil', async ({ page, local }) => {
  covers('estado:pedidos.mesas.vacio', 'estado:pedidos.llevar.vacio', 'estado:pedidos.mios.vacio')
  for (const table of local.tables) {
    await api(local).patch(`/tables/${String(table.id)}`, { is_active: false })
  }
  await openAs(page, local.waiter, '/pedidos')
  await expect(page.getByText('No hay mesas activas')).toBeVisible()
  await expect(page.getByText('Los pedidos para llevar siguen funcionando.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Crear mesas' })).toHaveCount(0)
  await evidence(page, 'sal-31-1-sin-mesas')
  await page.getByRole('tab', { name: 'Llevar y delivery' }).click()
  await expect(page.getByText('No hay pedidos para llevar ni delivery en curso')).toBeVisible()
  await page.getByRole('tab', { name: 'Mis pedidos' }).click()
  await expect(page.getByText('Todavía no tomaste pedidos hoy')).toBeVisible()
})

test('SAL-39 sin mesas activas, el encargado tiene el atajo para crearlas', async ({ page, local }) => {
  covers('funcion:pedidos.atajo-crear-mesas')
  for (const table of local.tables) {
    await api(local).patch(`/tables/${String(table.id)}`, { is_active: false })
  }
  await openAs(page, local.owner, '/pedidos')
  await expect(page.getByText('No hay mesas activas')).toBeVisible()
  await page.getByRole('link', { name: 'Crear mesas' }).click()
  await expect(page).toHaveURL(/\/mesas$/u)
})

test('SAL-32 si no cargan las mesas, los pedidos para llevar o los del mesero, se puede reintentar @movil', async ({
  page,
  local,
}) => {
  covers('estado:pedidos.mesas.error', 'estado:pedidos.llevar.error', 'estado:pedidos.mios.error')
  let healthy = await fail(page, '/tables')
  await openAs(page, local.waiter, '/pedidos')
  await expect(page.getByRole('main').getByText('No se pudieron cargar las mesas.')).toBeVisible()
  await evidence(page, 'sal-32-1-error-mesas')
  await retry(page, healthy)
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()

  healthy = await fail(page, '/orders/active')
  await page.goto('/pedidos?vista=llevar')
  await expect(page.getByRole('main').getByText('No se pudieron cargar los pedidos.')).toBeVisible()
  await retry(page, healthy)
  await expect(page.getByText('No hay pedidos para llevar ni delivery en curso')).toBeVisible()

  healthy = await fail(page, '/orders')
  await page.goto('/pedidos?vista=mios')
  await expect(page.getByRole('main').getByText('No se pudieron cargar tus pedidos.')).toBeVisible()
  await retry(page, healthy)
  await expect(page.getByText('Todavía no tomaste pedidos hoy')).toBeVisible()
})

test('SAL-33 si no carga la carta o el pedido, el mesero puede reintentar @movil', async ({ page, local }) => {
  covers('estado:pedido-nuevo.error', 'estado:pedido.error', 'estado:pedido.no-existe')
  const healthy = await fail(page, '/menu')
  await openAs(page, local.waiter, `/pedidos/nuevo?mesa=${String(local.table('1').id)}`)
  await expect(page.getByText('No se pudo cargar la carta.')).toBeVisible()
  await evidence(page, 'sal-33-1-error-carta')
  await retry(page, healthy)
  await expect(page.getByRole('button', { name: /^Lomo saltado/u })).toBeVisible()

  const order = await orderInTable(local, local.table('2'), [{ dish: local.dish('Chicha morada') }])
  const healthyOrder = await fail(page, `/orders/${String(order.id)}`)
  await page.goto(`/pedidos/${String(order.id)}`)
  await expect(page.getByText('No se pudo cargar el pedido.')).toBeVisible()
  await retry(page, healthyOrder)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()

  // Un pedido que no existe (o es de otro local) se lee como «no existe».
  await page.goto('/pedidos/999999')
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  await expect(page.getByRole('main').getByText(/no existe|no se encontr/iu)).toBeVisible()
  await page.getByRole('link', { name: 'Pedidos', exact: true }).first().click()
  await expect(page).toHaveURL(/\/pedidos$/u)
})

test('SAL-34 la hoja de impresión que no carga el pedido se puede reintentar', async ({ page, local }) => {
  covers('estado:imprimir.error')
  const order = await orderInTable(local, local.table('3'), [{ dish: local.dish('Lomo saltado') }])
  const healthy = await fail(page, `/orders/${String(order.id)}`)
  await openAs(page, local.waiter, `/imprimir/${String(order.id)}/comanda`)
  await expect(page.getByText('No se pudo cargar el pedido.')).toBeVisible()
  await retry(page, healthy)
  await expect(page.locator('#hoja-impresa')).toContainText('Comanda')
})

test('SAL-35 la cocina y el tablero dicen cuándo no hay pedidos y cuándo no cargan', async ({ page, local }) => {
  covers('estado:tablero.vacio', 'estado:tablero.error', 'estado:cocina.error', 'estado:historial.error')
  await openAs(page, local.owner, '/tablero')
  for (const status of ['Abierto', 'En cocina', 'Listo', 'Servido, por cobrar']) {
    await expect(page.getByRole('region', { name: `${status}: 0` })).toContainText('Sin pedidos')
  }
  await expect(page.getByRole('group', { name: 'Filtrar por tipo' })).toContainText('Todos (0)')
  await evidence(page, 'sal-35-1-tablero-vacio')

  let healthy = await fail(page, '/orders/active')
  await page.goto('/tablero')
  await expect(page.getByRole('main').getByText('No se pudieron cargar los pedidos.')).toBeVisible()
  await evidence(page, 'sal-35-2-tablero-error')
  await retry(page, healthy)
  await expect(page.getByRole('region', { name: 'Abierto: 0' })).toBeVisible()

  healthy = await fail(page, '/orders/active')
  await page.goto('/cocina')
  await expect(page.getByRole('main').getByText('No se pudieron cargar los pedidos.')).toBeVisible()
  await retry(page, healthy)
  await expect(page.getByText('Nada pendiente en cocina')).toBeVisible()

  healthy = await fail(page, '/orders')
  await page.goto('/tablero/historial')
  await expect(page.getByText('No se pudo cargar el historial.')).toBeVisible()
  await retry(page, healthy)
  await expect(page.getByText('Ningún pedido coincide con los filtros.')).toBeVisible()
})
