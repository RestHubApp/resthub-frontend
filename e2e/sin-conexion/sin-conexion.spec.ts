// HU37: el mesero sigue tomando pedidos aunque se caiga la señal. El pedido
// se guarda en el celular con un aviso visible, se envía solo al volver la
// conexión y nunca se duplica.
import type { Page } from '@playwright/test'

import { Cliente, type Local } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'

async function pedidosDeLaMesa(local: Local, mesaId: number) {
  const activos = await new Cliente(local.http, local.encargado.token).lista('/orders/active')
  return activos.filter((pedido) => pedido.table_id === mesaId)
}

async function elegirLomo(page: Page) {
  await page.getByRole('link', { name: /Mesa 1/u }).click()
  await expect(page).toHaveURL(/\/pedidos\/nuevo\?mesa=/u)
  await page.getByRole('button', { name: /Lomo saltado/u }).click()
  await expect(page.getByText('1 plato · Ver y anotar')).toBeVisible()
}

test('OFF-01 sin señal el pedido queda en la cola del celular y sale solo al volver, sin duplicarse @movil', async ({
  page,
  context,
  local,
}) => {
  cubre('funcion:pedidos.sin-conexion-encolar', 'funcion:pedidos.sin-conexion-reenviar', 'estado:pedidos.cola-sin-senal')
  await abrirComo(page, local.mesero, '/pedidos')
  await elegirLomo(page)
  await evidencia(page, 'off-01-1-plato-elegido')

  await context.setOffline(true)
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()

  // Queda en la cola a la vista, no colgado en «Enviando…».
  const cola = page.getByRole('status').filter({ hasText: '1 pedido espera señal' })
  await expect(cola).toBeVisible()
  await expect(cola).toContainText('Mesa 1')
  await expect(page).toHaveURL(/\/pedidos$/u)
  await evidencia(page, 'off-01-2-en-cola')
  expect(await pedidosDeLaMesa(local, local.mesa('1').id)).toHaveLength(0)

  await context.setOffline(false)
  await expect(page.getByText(/Mesa 1: pedido #\d+ enviado a cocina/u)).toBeVisible()
  await expect(cola).toBeHidden()
  await evidencia(page, 'off-01-3-enviado')

  // Un «Reintentar» o una segunda vuelta de la señal no lo vuelve a mandar.
  await context.setOffline(true)
  await context.setOffline(false)
  await expect
    .poll(async () => (await pedidosDeLaMesa(local, local.mesa('1').id)).map((p) => p.status))
    .toEqual(['in_kitchen'])
  await expect(page.getByRole('link', { name: /Mesa 1/u })).toContainText(/cocina/iu)
})

test('OFF-02 si el pedido llegó pero la respuesta se perdió, el reintento no lo duplica @movil', async ({
  page,
  local,
}) => {
  cubre('funcion:pedidos.sin-conexion-sin-duplicar')
  await abrirComo(page, local.mesero, '/pedidos')
  await elegirLomo(page)

  // El servidor recibe y guarda el pedido, pero al celular no le llega la
  // respuesta: para el celular es igual que no tener señal. Mientras dura el
  // corte, los reintentos automáticos tampoco llegan.
  let enviados = 0
  let sinSenal = true
  await page.route('**/api/v1/orders', async (ruta) => {
    if (ruta.request().method() !== 'POST' || !sinSenal) {
      await ruta.fallback()
      return
    }
    enviados += 1
    if (enviados === 1) {
      await ruta.fetch()
    }
    await ruta.abort('internetdisconnected')
  })
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  const cola = page.getByRole('status').filter({ hasText: '1 pedido espera señal' })
  await expect(cola).toBeVisible()
  expect(await pedidosDeLaMesa(local, local.mesa('1').id)).toHaveLength(1)
  await evidencia(page, 'off-02-1-en-cola-aunque-llego')

  sinSenal = false
  await cola.getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText(/Mesa 1: pedido #\d+ enviado a cocina/u)).toBeVisible()
  await expect(cola).toBeHidden()
  const pedidos = await pedidosDeLaMesa(local, local.mesa('1').id)
  expect(pedidos).toHaveLength(1)
  expect(pedidos[0]?.status).toBe('in_kitchen')
})
