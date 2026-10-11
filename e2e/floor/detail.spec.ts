// HU10, HU13, HU31, HU32: lo que el mesero y el encargado hacen con un pedido
// ya tomado: agregar platos, corregir uno abierto, cancelarlo con motivo,
// cambiarlo de mesa, unir otra mesa e imprimir la comanda y la precuenta.
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, countPrints, id, prints, readOrder, openOrder, orderInTable, orderPaid } from '../support/floor'

// eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
const soles = (amount: string) => new RegExp(`S/\\s*${amount.replace('.', '\\.')}`, 'u')

test('SAL-10 el mesero agrega platos a un pedido listo y vuelve a cocina @mobile', async ({ page, local }) => {
  covers('ruta:/pedidos/:orderId/agregar', 'funcion:agregar.agregar-platos')
  const order = await orderInTable(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])
  await api(local, local.kitchen).post(`/orders/${String(order.id)}/ready`)

  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Marcar servido' })).toBeVisible()
  await page.getByRole('link', { name: 'Agregar platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1 · Mesa 1' })).toBeVisible()
  await page.getByRole('button', { name: /^Ají de gallina/u }).click()
  await page.getByRole('button', { name: /^Inca Kola/u }).click()
  await evidence(page, 'sal-10-1-agregar')
  await page.getByRole('button', { name: 'Agregar al pedido' }).click()

  await expect(notice(page, 'Platos agregados al pedido #1.')).toBeVisible()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`/pedidos/${String(order.id)}$`, 'u'))
  await expect(page.getByText('En cocina', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(soles('62.00')).first()).toBeVisible()
  await evidence(page, 'sal-10-2-vuelve-a-cocina')
  const actual = await readOrder(local, id(order))
  expect(actual).toMatchObject({ status: 'in_kitchen', total: '62.00', item_count: 3 })
})

test('SAL-11 un pedido pagado no admite más platos', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:agregar.pedido-cerrado')
  const order = await orderPaid(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}/agregar`)
  await expect(page.getByText('Este pedido ya está pagado: no admite más platos.')).toBeVisible()
  await evidence(page, 'sal-11-1-cerrado')
})

test('SAL-12 un pedido que no se envió se corrige en el detalle y se envía desde ahí @mobile', async ({ page, local }) => {
  covers('dialogo:orders/detail/ItemNoteDialog', 'funcion:pedido.editar-plato', 'funcion:pedido.quitar-plato', 'funcion:pedido.enviar-pendiente')
  const order = await openOrder(local, local.table('2'), [
    { dish: local.dish('Lomo saltado') },
    { dish: local.dish('Inca Kola 500 ml') },
  ])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  await expect(page.getByText('Todavía no está en cocina')).toBeVisible()

  await page.getByRole('button', { name: 'Uno más de Lomo saltado' }).click()
  await expect(page.getByText(soles('64.00')).first()).toBeVisible()
  await page.getByRole('button', { name: 'Quitar Inca Kola 500 ml' }).click()
  await expect(notice(page, 'Inca Kola 500 ml quitado del pedido.')).toBeVisible()

  // La nota: cancelar no guarda; guardar la deja en el plato.
  await page.getByRole('button', { name: 'Agregar nota' }).click()
  const windowValue = page.getByRole('dialog', { name: 'Nota de Lomo saltado' })
  await windowValue.getByRole('textbox', { name: 'Nota para cocina' }).fill('Algo que no va')
  await windowValue.getByRole('button', { name: 'Cancelar' }).click()
  await expect(windowValue).toBeHidden()
  await page.getByRole('button', { name: 'Agregar nota' }).click()
  await windowValue.getByRole('textbox', { name: 'Nota para cocina' }).fill('Término medio')
  await evidence(page, 'sal-12-1-nota')
  await windowValue.getByRole('button', { name: 'Guardar nota' }).click()
  await expect(windowValue).toBeHidden()
  await expect(page.getByText('Término medio')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cambiar nota' })).toBeVisible()

  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(notice(page, 'Pedido #1 enviado a cocina.')).toBeVisible()
  await expect(page.getByText('En cocina: esta pantalla avisa sola cuando esté listo.')).toBeVisible()
  await evidence(page, 'sal-12-2-enviado')
  const actual = await readOrder(local, id(order))
  expect(actual).toMatchObject({ status: 'in_kitchen', total: '64.00' })
  expect(actual.items).toEqual([expect.objectContaining({ name: 'Lomo saltado', quantity: 2, notes: 'Término medio' })])
})

test('SAL-13 el encargado cancela un pedido con su motivo y la mesa queda libre', async ({ page, local }) => {
  covers('dialogo:orders/CancelOrderDialog', 'funcion:pedido.cancelar')
  const order = await orderInTable(local, local.table('3'), [{ dish: local.dish('Ceviche clásico') }])
  await openAs(page, local.owner, `/pedidos/${String(order.id)}`)
  await page.getByRole('button', { name: 'Cancelar pedido' }).click()
  const windowValue = page.getByRole('dialog', { name: '¿Cancelar el pedido #1?' })
  await expect(windowValue).toContainText('Mesa 3. La mesa queda libre')
  await windowValue.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(windowValue.getByText('Escribe el motivo')).toBeVisible()
  await windowValue.getByRole('button', { name: 'Volver' }).click()
  await expect(windowValue).toBeHidden()
  expect((await readOrder(local, id(order))).status).toBe('in_kitchen')

  await page.getByRole('button', { name: 'Cancelar pedido' }).click()
  await windowValue.getByRole('textbox', { name: 'Motivo' }).fill('El cliente se fue')
  await evidence(page, 'sal-13-1-motivo')
  await windowValue.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(notice(page, 'Pedido #1 cancelado.')).toBeVisible()
  await expect(page.getByText(/Cancelado el .*Motivo: El cliente se fue/u)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)
  await evidence(page, 'sal-13-2-cancelado')
  expect(await readOrder(local, id(order))).toMatchObject({ status: 'cancelled', cancel_reason: 'El cliente se fue' })
  await page.goto('/pedidos')
  await expect(page.getByRole('link', { name: /Mesa 3.*Libre/u })).toBeVisible()
})

test('SAL-14 el mesero no ve cómo cancelar un pedido @mobile', async ({ page, local }) => {
  covers('funcion:pedido.cancelar-sin-permiso')
  const order = await orderInTable(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  await expect(page.getByRole('link', { name: 'Agregar platos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)
})

test('SAL-15 el mesero cambia el pedido de mesa y une otra mesa suya @mobile', async ({ page, local }) => {
  covers('dialogo:orders/detail/TablePickerDialog', 'funcion:pedido.cambiar-mesa', 'funcion:pedido.unir-mesa')
  const first = await orderInTable(local, local.table('1'), [{ dish: local.dish('Lomo saltado') }])
  await orderInTable(local, local.table('2'), [{ dish: local.dish('Chicha morada'), quantity: 2 }])
  await openAs(page, local.waiter, `/pedidos/${String(first.id)}`)

  await page.getByRole('button', { name: 'Cambiar de mesa' }).click()
  const move = page.getByRole('dialog', { name: 'Cambiar de mesa' })
  await expect(move.getByRole('button', { name: /^Mesa/u })).toHaveText([/Mesa 3/u, /Mesa 4/u])
  await evidence(page, 'sal-15-1-mesas-libres')
  await move.getByRole('button', { name: 'Mesa 3' }).click()
  await expect(notice(page, 'Pedido #1 ahora en Mesa 3.')).toBeVisible()
  await expect(move).toBeHidden()
  await expect(page.getByText('Mesa 3', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Unir otra mesa' }).click()
  const join = page.getByRole('dialog', { name: 'Unir otra mesa a esta' })
  await expect(join.getByRole('button', { name: /Mesa 2/u })).toContainText(soles('16.00'))
  await join.getByRole('button', { name: /Mesa 2/u }).click()
  await expect(notice(page, 'Mesas unidas en el pedido #1.')).toBeVisible()
  await expect(page.getByText(soles('48.00')).first()).toBeVisible()
  await evidence(page, 'sal-15-2-unidas')

  // Ya no quedan otras mesas con pedido para unir.
  await page.getByRole('button', { name: 'Unir otra mesa' }).click()
  await expect(join.getByText('No tienes otras mesas con pedido')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(join).toBeHidden()

  const actual = await readOrder(local, id(first))
  expect(actual).toMatchObject({ table_id: local.table('3').id, total: '48.00' })
  const tables = await api(local).list('/tables')
  const free = tables.filter((m) => m.active_order === null).map((m) => m.label)
  expect(free).toEqual(['1', '2', '4'])
})

test('SAL-16 el mesero imprime la comanda sin precios y la precuenta @mobile', async ({ page, local }) => {
  covers('ruta:/imprimir/:orderId/:kind', 'funcion:pedido.imprimir-comanda', 'funcion:pedido.imprimir-precuenta', 'funcion:imprimir.reimprimir')
  await countPrints(page)
  const order = await orderInTable(local, local.table('4'), [
    { dish: local.dish('Lomo saltado'), notes: 'Sin cebolla' },
    { dish: local.dish('Inca Kola 500 ml'), quantity: 2 },
  ])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  await page.getByRole('link', { name: 'Imprimir comanda' }).click()
  const sheet = page.locator('#hoja-impresa')
  await expect(sheet).toContainText('Comanda')
  await expect(sheet).toContainText('#1')
  await expect(sheet).toContainText('Mesa 4')
  await expect(sheet).toContainText('1 × Lomo saltado')
  await expect(sheet).toContainText('» Sin cebolla')
  await expect(sheet).toContainText('2 × Inca Kola 500 ml')
  await expect(sheet).not.toContainText('S/')
  await expect.poll(() => prints(page)).toBe(1)
  await page.getByRole('button', { name: 'Imprimir' }).click()
  await expect.poll(() => prints(page)).toBe(2)
  await evidence(page, 'sal-16-1-comanda')

  await page.getByRole('link', { name: 'Pedido', exact: true }).click()
  await page.getByRole('link', { name: 'Imprimir precuenta' }).click()
  await expect(sheet).toContainText('Precuenta')
  await expect(sheet).toContainText('Restaurante E2E')
  await expect(sheet).toContainText(/Total\s*S\/\s*44\.00/u)
  await expect(sheet).toContainText(soles('12.00'))
  await expect.poll(() => prints(page)).toBe(3)
  await evidence(page, 'sal-16-2-precuenta')
})

test('SAL-36 el encargado lleva un pedido de cocina a cobrado desde el detalle', async ({ page, restaurantWithCashRegister: local }) => {
  covers('funcion:pedido.marcar-listo')
  const order = await orderInTable(local, local.table('1'), [{ dish: local.dish('Ají de gallina') }])
  await openAs(page, local.owner, `/pedidos/${String(order.id)}`)
  await page.getByRole('button', { name: 'Marcar listo' }).click()
  await expect(notice(page, 'Pedido #1 listo.')).toBeVisible()
  await page.getByRole('button', { name: 'Marcar servido' }).click()
  await expect(notice(page, 'Pedido #1 servido, por cobrar.')).toBeVisible()
  await page.getByRole('button', { name: 'Cobrar' }).click()
  const charge = page.getByRole('dialog', { name: 'Cobrar pedido #1' })
  await charge.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(page.getByRole('dialog', { name: 'Cobro registrado' })).toContainText('Pedido #1 pagado · Efectivo')
  expect((await readOrder(local, id(order))).status).toBe('paid')
})

test('SAL-37 el mesero sirve un pedido que tomó otro, pero no lo cobra @mobile', async ({ page, local }) => {
  covers('funcion:pedido.cobrar-solo-lo-suyo')
  const order = await orderInTable(local, local.table('2'), [{ dish: local.dish('Chicha morada') }], local.owner)
  await api(local).post(`/orders/${String(order.id)}/ready`)
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  await page.getByRole('button', { name: 'Marcar servido' }).click()
  await expect(notice(page, 'Pedido #1 servido, por cobrar.')).toBeVisible()
  await expect(page.getByText('Servido, por cobrar: lo cobra quien lo atendió o el encargado.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cobrar' })).toHaveCount(0)
  await evidence(page, 'sal-37-1-no-cobra')
})
