// HU11, HU13, HU14: el tablero del encargado y su historial. Filtro por tipo,
// las acciones de cada tarjeta (enviar, cobrar, cancelar) y el historial con
// filtros de fecha, estado, tipo y mesero, el detalle de cada fila y páginas.
import type { Page } from '@playwright/test'

import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import {
  api,
  id,
  leerPedido,
  pedidoAbierto,
  pedidoDelivery,
  pedidoParaLlevar,
  pedidoPagado,
  pedidoServido,
} from '../soporte/salon'

const columna = (page: Page, estado: string) => page.getByRole('region', { name: new RegExp(`^${estado}: \\d+$`, 'u') })
const tarjeta = (page: Page, numero: unknown) => page.getByRole('article', { name: `Pedido #${String(numero)}` })

/** Hoy y mañana en Lima, como `AAAA-MM-DD`. */
function diaEnLima(desplazamiento = 0): string {
  const dia = new Date(Date.now() + desplazamiento * 24 * 60 * 60 * 1000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(dia)
}

test('SAL-28 el encargado filtra el tablero por tipo y envía, cobra y cancela desde las tarjetas', async ({
  page,
  localConCaja: local,
}) => {
  cubre(
    'funcion:tablero.filtrar-tipo',
    'funcion:tablero.enviar-a-cocina',
    'funcion:tablero.cobrar',
    'funcion:tablero.cancelar',
    'funcion:tablero.ir-al-pedido',
  )
  const abierto = await pedidoAbierto(local, local.mesa('1'), [{ plato: local.plato('Chicha morada') }])
  const llevar = await pedidoParaLlevar(local, 'Ana', [{ plato: local.plato('Ají de gallina') }])
  const delivery = await pedidoDelivery(local, 'Luis', [{ plato: local.plato('Lomo saltado') }])
  const servido = await pedidoServido(local, local.mesa('2'), [{ plato: local.plato('Ceviche clásico') }])
  await abrirComo(page, local.encargado, '/tablero')

  const filtro = page.getByRole('group', { name: 'Filtrar por tipo' })
  await expect(filtro.getByRole('button')).toHaveText(['Todos (4)', 'En mesa (2)', 'Para llevar (1)', 'Delivery (1)'])
  await filtro.getByRole('button', { name: 'Para llevar (1)' }).click()
  await expect(filtro.getByRole('button', { name: 'Para llevar (1)' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(tarjeta(page, llevar.number)).toContainText('Para llevar · Ana')
  await filtro.getByRole('button', { name: 'Delivery (1)' }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(tarjeta(page, delivery.number)).toContainText('Delivery · Luis')
  await filtro.getByRole('button', { name: 'En mesa (2)' }).click()
  await expect(page.getByRole('article')).toHaveCount(2)
  await evidencia(page, 'sal-28-1-filtro')
  await filtro.getByRole('button', { name: 'Todos (4)' }).click()
  await expect(page.getByRole('article')).toHaveCount(4)

  // El pedido abierto se manda a cocina desde su tarjeta.
  await expect(columna(page, 'Abierto')).toContainText('Mesa 1')
  await tarjeta(page, abierto.number).getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(columna(page, 'En cocina').getByRole('article')).toHaveCount(3)
  await expect(columna(page, 'Abierto')).toContainText('Sin pedidos')

  // Cancelar el delivery desde la tarjeta.
  await page.getByRole('button', { name: `Cancelar pedido #${String(delivery.number)}` }).click()
  const cancelar = page.getByRole('dialog', { name: `¿Cancelar el pedido #${String(delivery.number)}?` })
  await expect(cancelar).toContainText('Delivery · Luis. El pedido pasa al historial como cancelado.')
  await cancelar.getByRole('textbox', { name: 'Motivo' }).fill('No contestó el teléfono')
  await cancelar.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(aviso(page, `Pedido #${String(delivery.number)} cancelado.`)).toBeVisible()
  await expect(tarjeta(page, delivery.number)).toHaveCount(0)

  // Cobrar el servido desde la tarjeta: la tarjeta sale y el recibo sigue a la vista.
  await tarjeta(page, servido.number).getByRole('button', { name: 'Cobrar' }).click()
  const cobro = page.getByRole('dialog', { name: `Cobrar pedido #${String(servido.number)}` })
  await cobro.getByText('Plin', { exact: true }).click()
  await cobro.getByRole('button', { name: 'Confirmar pago' }).click()
  const recibo = page.getByRole('dialog', { name: 'Cobro registrado' })
  await expect(recibo).toContainText(`Pedido #${String(servido.number)} pagado · Plin`)
  await expect(tarjeta(page, servido.number)).toHaveCount(0)
  await evidencia(page, 'sal-28-2-cobrado-desde-tablero')
  await recibo.getByRole('button', { name: 'Terminar' }).click()
  await expect(filtro.getByRole('button', { name: 'Todos (2)' })).toBeVisible()

  expect((await leerPedido(local, id(delivery))).status).toBe('cancelled')
  expect(await leerPedido(local, id(servido))).toMatchObject({ status: 'paid', payment_method: 'plin' })

  await tarjeta(page, llevar.number).getByRole('link', { name: `Pedido #${String(llevar.number)}` }).click()
  await expect(page).toHaveURL(new RegExp(`/pedidos/${String(llevar.id)}$`, 'u'))
})

test('SAL-29 el historial filtra por fecha, estado, tipo y mesero, y despliega el detalle de cada pedido', async ({
  page,
  localConCaja: local,
}) => {
  cubre(
    'ruta:/tablero/historial',
    'desplegable:orders/HistoryView',
    'funcion:historial.filtrar-fecha',
    'funcion:historial.filtrar-estado',
    'funcion:historial.filtrar-tipo',
    'funcion:historial.filtrar-mesero',
    'funcion:historial.ver-detalle',
    'estado:historial.vacio',
  )
  const pagado = await pedidoPagado(local, local.mesa('1'), [{ plato: local.plato('Lomo saltado') }])
  const cancelado = await pedidoParaLlevar(local, 'Rosa', [{ plato: local.plato('Chicha morada') }])
  await api(local).post(`/orders/${String(cancelado.id)}/cancel`, { reason: 'Pedido duplicado' })
  await pedidoParaLlevar(local, 'Pedro', [{ plato: local.plato('Inca Kola 500 ml') }], local.encargado)

  await abrirComo(page, local.encargado, '/tablero')
  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Historial de pedidos' })).toBeVisible()
  await expect(page.getByText('3 en total')).toBeVisible()
  const filas = page.getByRole('row').filter({ has: page.getByRole('cell') })
  await expect(filas).toHaveCount(3)
  await evidencia(page, 'sal-29-1-historial')

  await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'Pagado' })
  await expect(page.getByText('1 en total')).toBeVisible()
  await expect(filas).toHaveCount(1)
  await expect(filas.first()).toContainText('Mesa 1')
  await expect(filas.first()).toContainText('Tarjeta')

  // El desplegable de la fila muestra los platos y cómo se pagó.
  const ver = page.getByRole('button', { name: `Ver el detalle del pedido #${String(pagado.number)}` })
  await ver.click()
  const ocultar = page.getByRole('button', { name: `Ocultar el detalle del pedido #${String(pagado.number)}` })
  await expect(ocultar).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('Pagado con')).toBeVisible()
  await expect(page.getByText('1×Lomo saltado')).toBeVisible()
  await evidencia(page, 'sal-29-2-detalle')
  await ocultar.click()
  await expect(page.getByText('Pagado con')).toBeHidden()

  await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'Cancelado' })
  await expect(filas).toHaveCount(1)
  await page.getByRole('button', { name: `Ver el detalle del pedido #${String(cancelado.number)}` }).click()
  await expect(page.getByText(/Motivo: Pedido duplicado/u)).toBeVisible()
  await page.getByRole('combobox', { name: 'Estado' }).selectOption({ label: 'Cualquiera' })

  await page.getByRole('combobox', { name: 'Tipo' }).selectOption({ label: 'Para llevar' })
  await expect(page.getByText('2 en total')).toBeVisible()
  await page.getByRole('combobox', { name: 'Mesero' }).selectOption({ label: 'Encargada Prueba' })
  await expect(page.getByText('1 en total')).toBeVisible()
  await expect(filas.first()).toContainText('Para llevar · Pedro')
  await page.getByRole('combobox', { name: 'Mesero' }).selectOption({ label: 'Mesero Prueba' })
  await expect(filas.first()).toContainText('Para llevar · Rosa')
  await page.getByRole('combobox', { name: 'Tipo' }).selectOption({ label: 'En mesa y para llevar' })
  await page.getByRole('combobox', { name: 'Mesero' }).selectOption({ label: 'Cualquiera' })
  await expect(page.getByText('3 en total')).toBeVisible()

  await page.getByLabel('Desde').fill(diaEnLima(1))
  await page.getByLabel('Hasta').fill(diaEnLima(1))
  await expect(page.getByText('Ningún pedido coincide con los filtros.')).toBeVisible()
  await evidencia(page, 'sal-29-3-sin-resultados')
  await page.getByLabel('Desde').fill(diaEnLima(-1))
  await page.getByLabel('Hasta').fill(diaEnLima())
  await expect(page.getByText('3 en total')).toBeVisible()
})

test('SAL-30 el historial pagina de 25 en 25', async ({ page, local }) => {
  cubre('funcion:historial.paginar')
  const cliente = api(local, local.mesero)
  for (let i = 1; i <= 26; i += 1) {
    await cliente.post('/orders', { type: 'takeaway', customer_name: `Cliente ${String(i)}`, items: [] })
  }
  await abrirComo(page, local.encargado, '/tablero/historial')
  await expect(page.getByText('26 en total')).toBeVisible()
  const paginas = page.getByRole('navigation', { name: 'Paginación' })
  await expect(paginas).toContainText('Página 1 de 2')
  const filas = page.getByRole('row').filter({ has: page.getByRole('cell') })
  await expect(filas).toHaveCount(25)
  await expect(paginas.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  await paginas.getByRole('button', { name: 'Siguiente' }).click()
  await expect(paginas).toContainText('Página 2 de 2')
  await expect(filas).toHaveCount(1)
  await expect(paginas.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  await evidencia(page, 'sal-30-1-pagina-2')
  await paginas.getByRole('button', { name: 'Anterior' }).click()
  await expect(filas).toHaveCount(25)
})
