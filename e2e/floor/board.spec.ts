// HU11, HU13, HU14: el tablero del encargado y su historial. Filtro por tipo,
// las acciones de cada tarjeta (enviar, cobrar, cancelar) y el historial con
// filtros de fecha, estado, tipo y mesero, el detalle de cada fila y páginas.
import type { Page } from '@playwright/test'

import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import {
  api,
  id,
  readOrder,
  openOrder,
  orderDelivery,
  orderTakeaway,
  orderPaid,
  orderServed,
} from '../support/floor'

// eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
const column = (page: Page, status: string) => page.getByRole('region', { name: new RegExp(`^${status}: \\d+$`, 'u') })
const card = (page: Page, number: unknown) => page.getByRole('article', { name: `Pedido #${String(number)}` })

/** Hoy y mañana en Lima, como `AAAA-MM-DD`. */
function dayInLima(scroll = 0): string {
  const day = new Date(Date.now() + scroll * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(day)
}

test('SAL-28 el encargado filtra el tablero por tipo y envía, cobra y cancela desde las tarjetas', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  covers(
    'funcion:tablero.filtrar-tipo',
    'funcion:tablero.enviar-a-cocina',
    'funcion:tablero.cobrar',
    'funcion:tablero.cancelar',
    'funcion:tablero.ir-al-pedido',
  )
  const open = await openOrder(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])
  const takeaway = await orderTakeaway(local, 'Ana', [{ dish: local.dish('Ají de gallina') }])
  const delivery = await orderDelivery(local, 'Luis', [{ dish: local.dish('Lomo saltado') }])
  const served = await orderServed(local, local.table('2'), [{ dish: local.dish('Ceviche clásico') }])
  await openAs(page, local.owner, '/tablero')

  const filter = page.getByRole('group', { name: 'Filtrar por tipo' })
  await expect(filter.getByRole('button')).toHaveText(['Todos (4)', 'En mesa (2)', 'Para llevar (1)', 'Delivery (1)'])
  await filter.getByRole('button', { name: 'Para llevar (1)' }).click()
  await expect(filter.getByRole('button', { name: 'Para llevar (1)' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(card(page, takeaway.number)).toContainText('Para llevar · Ana')
  await filter.getByRole('button', { name: 'Delivery (1)' }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(card(page, delivery.number)).toContainText('Delivery · Luis')
  await filter.getByRole('button', { name: 'En mesa (2)' }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await evidence(page, 'sal-28-1-filtro')
  await filter.getByRole('button', { name: 'Todos (4)' }).click()
  await expect(page.getByRole('article')).toHaveCount(4)

  // El pedido abierto se manda a cocina desde su tarjeta.
  await expect(column(page, 'Abierto')).toContainText('Mesa 1')
  await card(page, open.number).getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(column(page, 'En cocina').getByRole('article')).toHaveCount(3)
  await expect(column(page, 'Abierto')).toContainText('Sin pedidos')

  // Cancelar el delivery desde la tarjeta.
  await page.getByRole('button', { name: `Cancelar pedido #${String(delivery.number)}` }).click()
  const cancel = page.getByRole('dialog', { name: `¿Cancelar el pedido #${String(delivery.number)}?` })
  await expect(cancel).toContainText('Delivery · Luis. El pedido pasa al historial como cancelado.')
  await cancel.getByRole('textbox', { name: 'Motivo' }).fill('No contestó el teléfono')
  await cancel.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(notice(page, `Pedido #${String(delivery.number)} cancelado.`)).toBeVisible()
  await expect(card(page, delivery.number)).toHaveCount(0)

  // Cobrar el servido desde la tarjeta: la tarjeta sale y el recibo sigue a la vista.
  await card(page, served.number).getByRole('button', { name: 'Cobrar' }).click()
  const charge = page.getByRole('dialog', { name: `Cobrar pedido #${String(served.number)}` })
  await charge.getByText('Plin', { exact: true }).click()
  await charge.getByRole('button', { name: 'Confirmar pago' }).click()
  const receipt = page.getByRole('dialog', { name: 'Cobro registrado' })
  await expect(receipt).toContainText(`Pedido #${String(served.number)} pagado · Plin`)
  await expect(card(page, served.number)).toHaveCount(0)
  await evidence(page, 'sal-28-2-cobrado-desde-tablero')
  await receipt.getByRole('button', { name: 'Terminar' }).click()
  await expect(filter.getByRole('button', { name: 'Todos (2)' })).toBeVisible()

  expect((await readOrder(local, id(delivery))).status).toBe('cancelled')
  expect(await readOrder(local, id(served))).toMatchObject({ status: 'paid', payment_method: 'plin' })

  await card(page, takeaway.number).getByRole('link', { name: `Pedido #${String(takeaway.number)}` }).click()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`/pedidos/${String(takeaway.id)}$`, 'u'))
})

test('SAL-29 el historial filtra por fecha, estado, tipo y mesero, y despliega el detalle de cada pedido', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  covers(
    'ruta:/tablero/historial',
    'desplegable:orders/history/HistoryColumns',
    'funcion:historial.filtrar-fecha',
    'funcion:historial.filtrar-estado',
    'funcion:historial.filtrar-tipo',
    'funcion:historial.filtrar-mesero',
    'funcion:historial.ver-detalle',
    'estado:historial.vacio',
  )
  const paid = await orderPaid(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])
  const cancelled = await orderTakeaway(local, 'Rosa', [{ dish: local.dish('Chicha morada') }])
  await api(local).post(`/orders/${String(cancelled.id)}/cancel`, { reason: 'Pedido duplicado' })
  await orderTakeaway(local, 'Pedro', [{ dish: local.dish('Inca Kola 500 ml') }], local.owner)

  await openAs(page, local.owner, '/tablero')
  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Historial de pedidos' })).toBeVisible()
  await expect(page.getByText('3 en total')).toBeVisible()
  const rows = page.getByRole('row').filter({ has: page.getByRole('cell') })
  await expect(rows).toHaveCount(3)
  await evidence(page, 'sal-29-1-historial')

  await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'Pagado' })
  await expect(page.getByText('1 en total')).toBeVisible()
  await expect(rows).toHaveCount(1)
  await expect(rows.first()).toContainText('Mesa 1')
  await expect(rows.first()).toContainText('Tarjeta')

  // El desplegable de la fila muestra los platos y cómo se pagó.
  const view = page.getByRole('button', { name: `Ver el detalle del pedido #${String(paid.number)}` })
  await view.click()
  const hide = page.getByRole('button', { name: `Ocultar el detalle del pedido #${String(paid.number)}` })
  await expect(hide).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Pagado con')).toBeVisible()
  await expect(page.getByText('1×Lomo saltado')).toBeVisible()
  await evidence(page, 'sal-29-2-detalle')
  await hide.click()
  await expect(page.getByText('Pagado con')).toBeHidden()

  await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'Cancelado' })
  await expect(rows).toHaveCount(1)
  await page.getByRole('button', { name: `Ver el detalle del pedido #${String(cancelled.number)}` }).click()
  await expect(page.getByText(/Motivo: Pedido duplicado/u)).toBeVisible()
  await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'Cualquiera' })

  await page.getByRole('combobox', { name: 'Tipo' }).selectOption({ label: 'Para llevar' })
  await expect(page.getByText('2 en total')).toBeVisible()
  await page.getByRole('combobox', { name: 'Mesero' }).selectOption({ label: 'Encargada Prueba' })
  await expect(page.getByText('1 en total')).toBeVisible()
  await expect(rows.first()).toContainText('Para llevar · Pedro')
  await page.getByRole('combobox', { name: 'Mesero' }).selectOption({ label: 'Mesero Prueba' })
  await expect(rows.first()).toContainText('Para llevar · Rosa')
  await page.getByRole('combobox', { name: 'Tipo' }).selectOption({ label: 'En mesa y para llevar' })
  await page.getByRole('combobox', { name: 'Mesero' }).selectOption({ label: 'Cualquiera' })
  await expect(page.getByText('3 en total')).toBeVisible()

  await page.getByLabel('Desde').fill(dayInLima(1))
  await page.getByLabel('Hasta').fill(dayInLima(1))
  await expect(page.getByText('Ningún pedido coincide con los filtros.')).toBeVisible()
  await evidence(page, 'sal-29-3-sin-resultados')
  await page.getByLabel('Desde').fill(dayInLima(-1))
  await page.getByLabel('Hasta').fill(dayInLima())
  await expect(page.getByText('3 en total')).toBeVisible()
})

test('SAL-30 el historial pagina de 25 en 25', async ({ page, local }) => {
  covers('funcion:historial.paginar')
  const customer = api(local, local.waiter)
  for (let i = 1; i <= 26; i += 1) {
    await customer.post('/orders', { type: 'takeaway', customer_name: `Cliente ${String(i)}`, items: [] })
  }
  await openAs(page, local.owner, '/tablero/historial')
  await expect(page.getByText('26 en total')).toBeVisible()
  const pages = page.getByRole('navigation', { name: 'Paginación' })
  await expect(pages).toContainText('Página 1 de 2')
  const rows = page.getByRole('row').filter({ has: page.getByRole('cell') })
  await expect(rows).toHaveCount(25)
  await expect(pages.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  await pages.getByRole('button', { name: 'Siguiente' }).click()
  await expect(pages).toContainText('Página 2 de 2')
  await expect(rows).toHaveCount(1)
  await expect(pages.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  await evidence(page, 'sal-30-1-pagina-2')
  await pages.getByRole('button', { name: 'Anterior' }).click()
  await expect(rows).toHaveCount(25)
})
