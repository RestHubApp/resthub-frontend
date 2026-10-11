// HU36: la libreta de clientes. Alta, búsqueda por nombre o teléfono, la
// ficha con visitas, gasto y ticket promedio (frecuente desde tres visitas) y
// la edición desde la ficha.
import { readFile } from 'node:fs/promises'

import type { Local } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, failureServer, id, soles } from '../support/management'

/** Un pedido del cliente de principio a fin, cobrado con Yape. */
async function orderOf(local: Local, customerId: number, type: 'delivery' | 'dine_in'): Promise<number> {
  const waiter = api(local, local.waiter)
  const data = type === 'delivery'
    ? { type: 'delivery', customer_id: customerId, customer_name: 'Rosa Díaz', customer_phone: '987654321', delivery_address: 'Av. Sol 123' }
    : { type: 'dine_in', table_id: local.table('1').id, customer_id: customerId }
  const order = await waiter.post('/orders', { ...data, items: [{ menu_item_id: local.dish('Chicha morada').id, quantity: 1, notes: '' }] })
  const route = `/orders/${String(id(order))}`
  await waiter.post(`${route}/send`)
  await api(local, local.kitchen).post(`${route}/ready`)
  await waiter.post(`${route}/served`)
  await waiter.post(`${route}/charge`, { payment_method: 'yape', tip: '0' })
  return id(order)
}

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-21 el encargado da de alta un cliente, lo busca, ve en su ficha que es frecuente y edita sus datos', async ({ page, restaurantWithCashRegister: local }) => {
  covers(
    'ruta:/clientes',
    'dialogo:customers/CustomerDialog',
    'hoja:customers/CustomerSheet',
    'funcion:clientes.crear',
    'funcion:clientes.consentimiento',
    'funcion:clientes.telefono-repetido',
    'funcion:clientes.buscar',
    'funcion:clientes.ver-ficha',
    'funcion:clientes.frecuente',
    'funcion:clientes.editar',
    'estado:clientes.vacio',
    'estado:clientes.sin-resultados',
    'estado:clientes.error',
  )
  await openAs(page, local.owner, '/clientes')
  await expect(page.getByRole('heading', { level: 1, name: 'Clientes' })).toBeVisible()
  await expect(page.getByText('Todavía no hay clientes')).toBeVisible()

  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const registration = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await registration.getByLabel('Correo (opcional)').fill('rosa@')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(registration.getByText('Escribe el nombre')).toBeVisible()
  await expect(registration.getByText('Escribe un correo válido')).toBeVisible()
  // Ley N.º 29733: sin el consentimiento del cliente no se guarda.
  await expect(registration.getByText('Sin su consentimiento no se puede guardar al cliente en la libreta.')).toBeVisible()
  await registration.getByLabel('Nombre', { exact: true }).fill('Rosa Díaz')
  await registration.getByLabel('Teléfono (opcional)').fill('987654321')
  await registration.getByLabel('Correo (opcional)').fill('rosa@correo.pe')
  await registration.getByLabel('Dirección (opcional)').fill('Av. Sol 123')
  await registration.getByLabel('Referencia (opcional)').fill('Frente al parque')
  await registration.getByLabel('Notas (opcional)').fill('Sin cebolla')
  await registration.getByRole('checkbox', { name: /Ley N\.º 29733/u }).click()
  await evidence(page, 'ges-21-1-nuevo-cliente')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Rosa Díaz: datos guardados.')).toBeVisible()
  const row = page.getByRole('button', { name: /Rosa Díaz/u })
  await expect(row).toContainText('0 visitas')
  await expect(page.getByRole('heading', { name: '1 cliente' })).toBeVisible()

  // El teléfono identifica al cliente: no se repite.
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await registration.getByLabel('Nombre', { exact: true }).fill('Otra Rosa')
  await registration.getByLabel('Teléfono (opcional)').fill('987654321')
  await registration.getByRole('checkbox', { name: /Ley N\.º 29733/u }).click()
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(registration.getByRole('alert')).toContainText('El teléfono 987654321 ya es de Rosa Díaz.')
  await registration.getByRole('button', { name: 'Cancelar' }).click()
  await expect(registration).toBeHidden()

  // Tres pedidos de delivery lo vuelven frecuente.
  const customerId = id((await api(local).list('/customers'))[0])
  for (let n = 0; n < 3; n += 1) {
    await orderOf(local, customerId, 'delivery')
  }
  await page.reload()
  await expect(row).toContainText('Frecuente')
  await expect(row).toContainText(/3 visitas · S\/\s*24\.00/u)

  const search = page.getByRole('searchbox', { name: 'Buscar por nombre o teléfono' })
  await search.fill('999')
  await expect(page.getByText('Nadie coincide con la búsqueda')).toBeVisible()
  await search.fill('9876')
  await expect(row).toBeVisible()
  await search.fill('rosa')
  await expect(row).toBeVisible()

  await row.click()
  const card = page.getByRole('dialog', { name: 'Rosa Díaz' })
  await expect(card).toContainText('987654321 · rosa@correo.pe')
  const figure = (name: string) => card.getByRole('term').filter({ hasText: name }).locator('xpath=..')
  await expect(figure('Visitas')).toContainText('3')
  await expect(figure('Gastado')).toContainText(soles('24.00'))
  await expect(figure('Ticket prom.')).toContainText(soles('8.00'))
  await expect(card).toContainText('Cliente frecuente')
  await expect(card).toContainText('Av. Sol 123 · Ref.: Frente al parque')
  await expect(card).toContainText('Sin cebolla')
  await expect(card.getByRole('link', { name: /#\d/u })).toHaveCount(3)
  await evidence(page, 'ges-21-2-ficha')

  await card.getByRole('button', { name: 'Editar datos' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar a Rosa Díaz' })
  await expect(edit.getByLabel('Dirección (opcional)')).toHaveValue('Av. Sol 123')
  await edit.getByLabel('Notas (opcional)').fill('Alérgica al maní')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Rosa Díaz: datos guardados.')).toBeVisible()
  expect((await api(local).get(`/customers/${String(customerId)}`)).notes).toBe('Alérgica al maní')

  await failureServer(page, '/customers')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Reintentar' })).toBeVisible()
})

test('GES-22 la ficha del cliente dice el tipo de cada pedido en español', async ({ page, restaurantWithCashRegister: local }) => {
  const customer = await api(local).post('/customers', { name: 'Julio Paz', phone: '912345678', email: '', address: '', reference: '', notes: '', consent: true })
  await orderOf(local, id(customer), 'dine_in')
  await openAs(page, local.owner, '/clientes')
  await page.getByRole('button', { name: /Julio Paz/u }).click()
  const order = page.getByRole('dialog', { name: 'Julio Paz' }).getByRole('link', { name: /#1/u })
  await expect(order).toBeVisible()
  await evidence(page, 'ges-22-1-tipo-de-pedido')
  await expect(order).toContainText('En mesa')
})

test('GES-25 la ventana de un cliente nuevo abre vacía después de guardar otro', async ({ page, local }) => {
  await openAs(page, local.owner, '/clientes')
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const registration = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await registration.getByLabel('Nombre', { exact: true }).fill('Rosa Díaz')
  await registration.getByLabel('Teléfono (opcional)').fill('987654321')
  await registration.getByLabel('Notas (opcional)').fill('Sin cebolla')
  await registration.getByRole('checkbox', { name: /Ley N\.º 29733/u }).click()
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Rosa Díaz: datos guardados.')).toBeVisible()
  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  await evidence(page, 'ges-25-1-cliente-nuevo-vacio')
  await expect(registration.getByRole('checkbox', { name: /Ley N\.º 29733/u })).not.toBeChecked()
  await expect(registration.getByLabel('Nombre', { exact: true })).toHaveValue('')
  await expect(registration.getByLabel('Teléfono (opcional)')).toHaveValue('')
  await expect(registration.getByLabel('Notas (opcional)')).toHaveValue('')
})

test('GES-34 el encargado descarga los datos de un cliente y, a su pedido, los borra', async ({ page, restaurantWithCashRegister: local }) => {
  covers('confirmacion:customers/CustomerRights', 'funcion:clientes.exportar-datos', 'funcion:clientes.borrar-datos')
  const customer = await api(local).post('/customers', {
    name: 'Rosa Díaz', phone: '987654321', email: '', address: 'Av. Sol 123', reference: '', notes: 'Alérgica al maní', consent: true,
  })
  const orderId = await orderOf(local, id(customer), 'delivery')
  await openAs(page, local.owner, '/clientes')
  await page.getByRole('button', { name: /Rosa Díaz/u }).click()
  const card = page.getByRole('dialog', { name: 'Rosa Díaz' })

  // Derecho de acceso: un archivo con lo que se guarda de ella.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    card.getByRole('button', { name: 'Descargar sus datos' }).click(),
  ])
  expect(download.suggestedFilename()).toBe(`cliente-${String(id(customer))}-datos.json`)
  const route = await download.path()
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- la ruta la entrega Playwright para su propia descarga
  const data = JSON.parse(await readFile(route, 'utf8')) as { notes: string; orders: { delivery_address: string }[] }
  expect(data.notes).toBe('Alérgica al maní')
  expect(data.orders.map((order) => order.delivery_address)).toEqual(['Av. Sol 123'])

  // Derecho de cancelación: se confirma porque no se deshace.
  await card.getByRole('button', { name: 'Borrar sus datos' }).click()
  const confirm = page.getByRole('alertdialog', { name: '¿Borrar los datos de Rosa Díaz?' })
  await expect(confirm).toContainText('No se puede deshacer.')
  await evidence(page, 'ges-34-1-confirmar-borrado')
  await confirm.getByRole('button', { name: 'Borrar sus datos' }).click()
  await expect(notice(page, 'Los datos del cliente se borraron.')).toBeVisible()
  await expect(card).toBeHidden()
  await expect(page.getByText('Todavía no hay clientes')).toBeVisible()
  const orderResponse = await api(local).get(`/orders/${String(orderId)}`)
  expect(orderResponse).toMatchObject({ customer_name: 'Cliente eliminado', customer_phone: '', delivery_address: '' })
})
