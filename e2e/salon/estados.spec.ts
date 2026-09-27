// Los estados vacíos y de error de cada pantalla del salón, la cocina y el
// tablero. Un error se provoca respondiendo 500 a esa lectura; «Reintentar»
// la vuelve a pedir y la pantalla se recupera sin recargar.
import type { Page } from '@playwright/test'

import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'
import { api, pedidoEnMesa } from '../soporte/salon'

/** Hace fallar con 500 las lecturas a esa ruta exacta del API; devuelve cómo dejar de fallar. */
async function fallar(page: Page, ruta: string): Promise<() => Promise<void>> {
  const coincide = (url: URL) => url.pathname === `/api/v1${ruta}`
  await page.route(coincide, async (r) => r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
  return async () => {
    await page.unroute(coincide)
  }
}

async function reintentar(page: Page, sana: () => Promise<void>): Promise<void> {
  await sana()
  await page.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toHaveCount(0)
}

test('SAL-31 sin mesas activas ni pedidos, cada pestaña del mesero lo dice @movil', async ({ page, local }) => {
  cubre('estado:pedidos.mesas.vacio', 'estado:pedidos.llevar.vacio', 'estado:pedidos.mios.vacio')
  for (const mesa of local.mesas) {
    await api(local).patch(`/tables/${String(mesa.id)}`, { is_active: false })
  }
  await abrirComo(page, local.mesero, '/pedidos')
  await expect(page.getByText('No hay mesas activas')).toBeVisible()
  await expect(page.getByText('Los pedidos para llevar siguen funcionando.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Crear mesas' })).toHaveCount(0)
  await evidencia(page, 'sal-31-1-sin-mesas')
  await page.getByRole('tab', { name: 'Llevar y delivery' }).click()
  await expect(page.getByText('No hay pedidos para llevar ni delivery en curso')).toBeVisible()
  await page.getByRole('tab', { name: 'Mis pedidos' }).click()
  await expect(page.getByText('Todavía no tomaste pedidos hoy')).toBeVisible()
})

test('SAL-39 sin mesas activas, el encargado tiene el atajo para crearlas', async ({ page, local }) => {
  cubre('funcion:pedidos.atajo-crear-mesas')
  for (const mesa of local.mesas) {
    await api(local).patch(`/tables/${String(mesa.id)}`, { is_active: false })
  }
  await abrirComo(page, local.encargado, '/pedidos')
  await expect(page.getByText('No hay mesas activas')).toBeVisible()
  await page.getByRole('link', { name: 'Crear mesas' }).click()
  await expect(page).toHaveURL(/\/mesas$/u)
})

test('SAL-32 si no cargan las mesas, los pedidos para llevar o los del mesero, se puede reintentar @movil', async ({
  page,
  local,
}) => {
  cubre('estado:pedidos.mesas.error', 'estado:pedidos.llevar.error', 'estado:pedidos.mios.error')
  let sana = await fallar(page, '/tables')
  await abrirComo(page, local.mesero, '/pedidos')
  await expect(page.getByText('No se pudieron cargar las mesas.')).toBeVisible()
  await evidencia(page, 'sal-32-1-error-mesas')
  await reintentar(page, sana)
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()

  sana = await fallar(page, '/orders/active')
  await page.goto('/pedidos?vista=llevar')
  await expect(page.getByText('No se pudieron cargar los pedidos.')).toBeVisible()
  await reintentar(page, sana)
  await expect(page.getByText('No hay pedidos para llevar ni delivery en curso')).toBeVisible()

  sana = await fallar(page, '/orders')
  await page.goto('/pedidos?vista=mios')
  await expect(page.getByText('No se pudieron cargar tus pedidos.')).toBeVisible()
  await reintentar(page, sana)
  await expect(page.getByText('Todavía no tomaste pedidos hoy')).toBeVisible()
})

test('SAL-33 si no carga la carta o el pedido, el mesero puede reintentar @movil', async ({ page, local }) => {
  cubre('estado:pedido-nuevo.error', 'estado:pedido.error', 'estado:pedido.no-existe')
  const sana = await fallar(page, '/menu')
  await abrirComo(page, local.mesero, `/pedidos/nuevo?mesa=${String(local.mesa('1').id)}`)
  await expect(page.getByText('No se pudo cargar la carta.')).toBeVisible()
  await evidencia(page, 'sal-33-1-error-carta')
  await reintentar(page, sana)
  await expect(page.getByRole('button', { name: /^Lomo saltado/u })).toBeVisible()

  const pedido = await pedidoEnMesa(local, local.mesa('2'), [{ plato: local.plato('Chicha morada') }])
  const sanaPedido = await fallar(page, `/orders/${String(pedido.id)}`)
  await page.goto(`/pedidos/${String(pedido.id)}`)
  await expect(page.getByText('No se pudo cargar el pedido.')).toBeVisible()
  await reintentar(page, sanaPedido)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()

  // Un pedido que no existe (o es de otro local) se lee como «no existe».
  await page.goto('/pedidos/999999')
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
  await expect(page.getByText(/no existe|no se encontr/iu)).toBeVisible()
  await page.getByRole('link', { name: 'Pedidos', exact: true }).first().click()
  await expect(page).toHaveURL(/\/pedidos$/u)
})

test('SAL-34 la hoja de impresión que no carga el pedido se puede reintentar', async ({ page, local }) => {
  cubre('estado:imprimir.error')
  const pedido = await pedidoEnMesa(local, local.mesa('3'), [{ plato: local.plato('Lomo saltado') }])
  const sana = await fallar(page, `/orders/${String(pedido.id)}`)
  await abrirComo(page, local.mesero, `/imprimir/${String(pedido.id)}/comanda`)
  await expect(page.getByText('No se pudo cargar el pedido.')).toBeVisible()
  await reintentar(page, sana)
  await expect(page.locator('#hoja-impresa')).toContainText('Comanda')
})

test('SAL-35 la cocina y el tablero dicen cuándo no hay pedidos y cuándo no cargan', async ({ page, local }) => {
  cubre('estado:tablero.vacio', 'estado:tablero.error', 'estado:cocina.error', 'estado:historial.error')
  await abrirComo(page, local.encargado, '/tablero')
  for (const estado of ['Abierto', 'En cocina', 'Listo', 'Servido, por cobrar']) {
    await expect(page.getByRole('region', { name: `${estado}: 0` })).toContainText('Sin pedidos')
  }
  await expect(page.getByRole('group', { name: 'Filtrar por tipo' })).toContainText('Todos (0)')
  await evidencia(page, 'sal-35-1-tablero-vacio')

  let sana = await fallar(page, '/orders/active')
  await page.goto('/tablero')
  await expect(page.getByText('No se pudieron cargar los pedidos.')).toBeVisible()
  await evidencia(page, 'sal-35-2-tablero-error')
  await reintentar(page, sana)
  await expect(page.getByRole('region', { name: 'Abierto: 0' })).toBeVisible()

  sana = await fallar(page, '/orders/active')
  await page.goto('/cocina')
  await expect(page.getByText('No se pudieron cargar los pedidos.')).toBeVisible()
  await reintentar(page, sana)
  await expect(page.getByText('Nada pendiente en cocina')).toBeVisible()

  sana = await fallar(page, '/orders')
  await page.goto('/tablero/historial')
  await expect(page.getByText('No se pudo cargar el historial.')).toBeVisible()
  await reintentar(page, sana)
  await expect(page.getByText('Ningún pedido coincide con los filtros.')).toBeVisible()
})
