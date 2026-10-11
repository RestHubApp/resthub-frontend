// HU09, HU36: pedidos para llevar y delivery desde el celular. El delivery
// exige nombre, teléfono y dirección; el cliente frecuente se busca por nombre
// o teléfono, y uno nuevo queda en la libreta.
import type { Locator, Page } from '@playwright/test'

import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, id, readOrder } from '../support/floor'

async function openTakeaway(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Para llevar / Delivery' }).click()
  const windowValue = page.getByRole('dialog', { name: 'Pedido para llevar o delivery' })
  await expect(windowValue).toBeVisible()
  return windowValue
}

async function sendUnDish(page: Page, dish: RegExp): Promise<void> {
  await page.getByRole('button', { name: dish }).click()
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(notice(page, /enviado a cocina/u)).toBeVisible()
  await expect(page).toHaveURL(/\/pedidos$/u)
}

test('SAL-22 el mesero toma un pedido para llevar y lo encuentra en sus pestañas @mobile', async ({ page, local }) => {
  covers(
    'dialogo:orders/floor/TakeawayForm',
    'pestanas:orders/OrdersView',
    'funcion:pedidos.para-llevar',
    'funcion:pedidos.pestana-llevar',
    'funcion:pedidos.pestana-mis-pedidos',
  )
  await openAs(page, local.waiter, '/pedidos')
  let windowValue = await openTakeaway(page)
  await windowValue.getByRole('textbox', { name: 'Nombre del cliente (opcional)' }).fill('Borrador')
  await windowValue.getByRole('button', { name: 'Cancelar' }).click()
  await expect(windowValue).toBeHidden()

  windowValue = await openTakeaway(page)
  await expect(windowValue.getByRole('radio', { name: 'Recoge en local' })).toHaveAttribute('aria-checked', 'true')
  await expect(windowValue.getByRole('textbox', { name: 'Nombre del cliente (opcional)' })).toHaveValue('')
  await windowValue.getByRole('textbox', { name: 'Nombre del cliente (opcional)' }).fill('Ana')
  await evidence(page, 'sal-22-1-para-llevar')
  await windowValue.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Para llevar · Ana' })).toBeVisible()
  await sendUnDish(page, /^Chicha morada/u)

  const tabs = page.getByRole('tablist')
  await tabs.getByRole('tab', { name: 'Llevar y delivery' }).click()
  await expect(page).toHaveURL(/vista=llevar/u)
  const takeaway = page.getByRole('tabpanel', { name: 'Llevar y delivery' })
  await expect(takeaway.getByRole('heading', { name: 'En curso (1)' })).toBeVisible()
  await expect(takeaway.getByRole('link', { name: /#1.*Para llevar · Ana/u })).toContainText('En cocina')
  await evidence(page, 'sal-22-2-pestana-llevar')

  await tabs.getByRole('tab', { name: 'Mis pedidos' }).click()
  const mine = page.getByRole('tabpanel', { name: 'Mis pedidos' })
  await expect(mine.getByRole('link', { name: /Para llevar · Ana/u })).toBeVisible()
  // Volver atrás desde el pedido deja al mesero en la misma pestaña.
  await mine.getByRole('link', { name: /Para llevar · Ana/u }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await page.goBack()
  await expect(tabs.getByRole('tab', { name: 'Mis pedidos' })).toHaveAttribute('aria-selected', 'true')
  await tabs.getByRole('tab', { name: 'Mesas' }).click()
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()

  const [order] = await api(local, local.waiter).list('/orders/active')
  expect(order).toMatchObject({ type: 'takeaway', customer_name: 'Ana', status: 'in_kitchen' })
})

test('SAL-23 un delivery exige nombre, teléfono y dirección, y el cliente nuevo queda en la libreta @mobile', async ({
  page,
  local,
}) => {
  covers('funcion:pedidos.delivery', 'funcion:pedidos.cliente-nuevo-a-libreta', 'funcion:pedido.datos-delivery')
  await openAs(page, local.waiter, '/pedidos')
  const windowValue = await openTakeaway(page)
  await windowValue.getByRole('radio', { name: 'Delivery' }).click()
  await windowValue.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(windowValue.getByText('Escribe el nombre de quien recibe')).toBeVisible()
  await expect(windowValue.getByText('Escribe un teléfono para coordinar la entrega')).toBeVisible()
  await expect(windowValue.getByText('Escribe la dirección de entrega')).toBeVisible()
  await evidence(page, 'sal-23-1-faltan-datos')

  await windowValue.getByRole('textbox', { name: 'Nombre de quien recibe' }).fill('Luis Quispe')
  await windowValue.getByRole('textbox', { name: 'Teléfono' }).fill('912345678')
  await windowValue.getByRole('textbox', { name: 'Dirección de entrega' }).fill('Jr. Huallaga 450, Cercado')
  await windowValue.getByRole('textbox', { name: 'Referencia (opcional)' }).fill('Puerta verde')
  // Ley N.º 29733: el cliente acepta quedar en la libreta.
  await windowValue.getByRole('checkbox', { name: /Ley N\.º 29733/u }).click()
  await windowValue.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Delivery · Luis Quispe' })).toBeVisible()
  await expect(page.getByText('Nuevo delivery a Jr. Huallaga 450, Cercado.')).toBeVisible()
  await sendUnDish(page, /^Ají de gallina/u)

  const customers = await api(local).list('/customers?q=912345678')
  expect(customers).toEqual([expect.objectContaining({ name: 'Luis Quispe', address: 'Jr. Huallaga 450, Cercado' })])
  const [order] = await api(local, local.waiter).list('/orders/active')
  expect(order).toMatchObject({ type: 'delivery', customer_phone: '912345678', customer_id: customers[0].id })

  await page.goto(`/pedidos/${String(id(order))}`)
  const delivery = page.getByRole('region', { name: 'Entrega' })
  await expect(delivery).toContainText('Jr. Huallaga 450, Cercado')
  await expect(delivery).toContainText('Ref.: Puerta verde')
  await expect(delivery.getByRole('link', { name: '912345678' })).toHaveAttribute('href', 'tel:912345678')
  await evidence(page, 'sal-23-2-detalle-delivery')
})

test('SAL-23B sin el consentimiento del cliente, el delivery sale igual y no queda en la libreta @mobile', async ({
  page,
  local,
}) => {
  covers('funcion:pedidos.delivery-sin-consentimiento')
  await openAs(page, local.waiter, '/pedidos')
  const windowValue = await openTakeaway(page)
  await windowValue.getByRole('radio', { name: 'Delivery' }).click()
  await windowValue.getByRole('textbox', { name: 'Nombre de quien recibe' }).fill('Marta Rojas')
  await windowValue.getByRole('textbox', { name: 'Teléfono' }).fill('934567812')
  await windowValue.getByRole('textbox', { name: 'Dirección de entrega' }).fill('Av. Grau 300, Barranco')
  await expect(windowValue.getByRole('checkbox', { name: /Ley N\.º 29733/u })).not.toBeChecked()
  await windowValue.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Delivery · Marta Rojas' })).toBeVisible()
  await sendUnDish(page, /^Ají de gallina/u)

  expect(await api(local).list('/customers?q=934567812')).toEqual([])
  const [order] = await api(local, local.waiter).list('/orders/active')
  expect(order).toMatchObject({ type: 'delivery', customer_phone: '934567812', customer_id: null })
})

test('SAL-24 el mesero encuentra al cliente frecuente por nombre y no le vuelve a pedir los datos @mobile', async ({
  page,
  local,
}) => {
  covers('funcion:pedidos.buscar-cliente-frecuente', 'estado:pedidos.cliente-no-encontrado')
  const rosa = await api(local).post('/customers', {
    name: 'Rosa Pérez',
    phone: '999888777',
    email: '',
    address: 'Av. Brasil 1200, Magdalena',
    reference: 'Edificio azul',
    notes: '',
    consent: true,
  })
  await openAs(page, local.waiter, '/pedidos')
  const windowValue = await openTakeaway(page)
  await windowValue.getByRole('radio', { name: 'Delivery' }).click()
  const search = windowValue.getByRole('searchbox', { name: 'Buscar cliente frecuente (opcional)' })
  await search.fill('Zzz')
  await expect(windowValue.getByText('No está en la libreta: escribe sus datos abajo.')).toBeVisible()
  await search.fill('Ros')
  const result = windowValue.getByRole('button', { name: /Rosa Pérez/u })
  await expect(result).toContainText('999888777 · Av. Brasil 1200, Magdalena')
  await evidence(page, 'sal-24-1-busqueda')
  await result.click()
  await expect(search).toHaveValue('')
  await expect(windowValue.getByRole('textbox', { name: 'Nombre de quien recibe' })).toHaveValue('Rosa Pérez')
  await expect(windowValue.getByRole('textbox', { name: 'Teléfono' })).toHaveValue('999888777')
  await expect(windowValue.getByRole('textbox', { name: 'Dirección de entrega' })).toHaveValue('Av. Brasil 1200, Magdalena')
  await expect(windowValue.getByRole('textbox', { name: 'Referencia (opcional)' })).toHaveValue('Edificio azul')
  await expect(windowValue.getByRole('radio', { name: 'Delivery' })).toHaveAttribute('aria-checked', 'true')
  await windowValue.getByRole('button', { name: 'Elegir platos' }).click()
  await sendUnDish(page, /^Lomo saltado/u)

  const [order] = await api(local, local.waiter).list('/orders/active')
  expect(order).toMatchObject({ type: 'delivery', customer_id: rosa.id, delivery_address: 'Av. Brasil 1200, Magdalena' })
  expect((await readOrder(local, id(order))).customer_name).toBe('Rosa Pérez')
  const notebook = await api(local).list('/customers?q=Rosa')
  expect(notebook).toHaveLength(1)
})
