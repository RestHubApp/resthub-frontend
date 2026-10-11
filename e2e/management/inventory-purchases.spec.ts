// HU34: proveedores y órdenes de compra. La orden se arma desde las
// sugerencias de reposición o a mano, se envía y al recibirla entra al stock
// con su costo real.
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, soles } from '../support/management'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-08 el encargado da de alta un proveedor, arma una orden desde las sugerencias, la envía y al recibirla entra al stock', async ({ page, local }) => {
  covers(
    'dialogo:inventory/SupplierDialog',
    'dialogo:inventory/PurchaseOrderDialog',
    'dialogo:inventory/ReceiveOrderDialog',
    'funcion:proveedores.crear',
    'funcion:proveedores.editar',
    'funcion:compras.orden-desde-sugerencias',
    'funcion:compras.enviar',
    'funcion:compras.recibir',
    'estado:proveedores.vacio',
    'estado:compras.vacio',
  )
  await openAs(page, local.owner, '/inventario?vista=proveedores')
  const suppliers = page.getByRole('tabpanel', { name: /Proveedores/u })
  await expect(suppliers.getByText('Todavía no hay proveedores')).toBeVisible()
  await suppliers.getByRole('button', { name: 'Nuevo proveedor' }).click()
  const registration = page.getByRole('dialog', { name: 'Nuevo proveedor' })
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(registration.getByText('Escribe el nombre del proveedor')).toBeVisible()
  await registration.getByLabel('Nombre').fill('Mercado Mayorista')
  await registration.getByLabel('Contacto (opcional)').fill('Don Julio')
  await registration.getByLabel('Teléfono (opcional)').fill('987654321')
  await registration.getByLabel('Nota (opcional)').fill('Entrega martes y viernes')
  await evidence(page, 'ges-08-1-proveedor')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Proveedor «Mercado Mayorista» guardado.')).toBeVisible()
  const row = suppliers.getByRole('listitem').filter({ hasText: 'Mercado Mayorista' })
  await expect(row).toContainText('Don Julio · 987654321 · Entrega martes y viernes')

  await row.getByRole('button', { name: 'Editar' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar Mercado Mayorista' })
  await expect(edit.getByLabel('Contacto (opcional)')).toHaveValue('Don Julio')
  await edit.getByLabel('Teléfono (opcional)').fill('912345678')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(edit).toBeHidden()
  await expect(row).toContainText('Don Julio · 912345678')

  // La orden: el Culantro está bajo su mínimo y viene sugerido.
  await page.getByRole('tab', { name: /Compras/u }).click()
  const purchases = page.getByRole('tabpanel', { name: /Compras/u })
  await expect(purchases.getByText('Todavía no hay órdenes de compra')).toBeVisible()
  await purchases.getByRole('button', { name: 'Nueva orden' }).click()
  const order = page.getByRole('dialog', { name: 'Nueva orden de compra' })
  const create = order.getByRole('button', { name: 'Crear orden' })
  await expect(create).toBeDisabled()
  await order.getByLabel('Proveedor').selectOption({ label: 'Mercado Mayorista' })
  await order.getByRole('button', { name: 'Cargar sugerencias (1)' }).click()
  await expect(order.getByLabel('Insumo de la línea 1')).toHaveValue(String(local.ingredients[2].id))
  await expect(order.getByLabel('Cantidad en g')).toHaveValue('300.000')
  await evidence(page, 'ges-08-2-orden-sugerida')
  await create.click()
  await expect(notice(page, /Orden de compra 1 creada \(S\/\s*3\.60\)\./u)).toBeVisible()
  const oc1 = purchases.getByRole('listitem').filter({ hasText: 'OC 1 · Mercado Mayorista' })
  await expect(oc1).toContainText('Borrador')
  await expect(oc1).toContainText('Culantro')
  await expect(oc1).toContainText(soles('3.60'))

  await oc1.getByRole('button', { name: 'Marcar enviada' }).click()
  await expect(notice(page, 'Orden 1: enviada.')).toBeVisible()
  await expect(oc1).toContainText('Enviada')
  await expect(oc1.getByRole('button', { name: 'Marcar enviada' })).toBeHidden()

  // Llegó menos de lo pedido y más caro: se corrige al recibir.
  await oc1.getByRole('button', { name: 'Recibir' }).click()
  const receive = page.getByRole('dialog', { name: 'Recibir la orden 1' })
  await expect(receive).toContainText('Mercado Mayorista')
  await expect(receive).toContainText('Pedido: 300 g')
  await receive.getByLabel('Cantidad recibida de Culantro').fill('250')
  await receive.getByLabel('Costo real por unidad de Culantro').fill('0.014')
  await evidence(page, 'ges-08-3-recibir')
  await receive.getByRole('button', { name: 'Recibir y cargar al stock' }).click()
  await expect(notice(page, /Orden 1 recibida: S\/\s*3\.50 entraron al stock\./u)).toBeVisible()
  await expect(oc1).toContainText('Recibida')
  await expect(oc1).toContainText(/Recibido S\/\s*3\.50/u)
  await expect(oc1.getByRole('button', { name: 'Recibir' })).toBeHidden()

  // Lo recibido es una compra más del libro y la alerta se fue.
  await expect(page.getByText('Stock en orden: nada por debajo del mínimo.')).toBeVisible()
  await page.getByRole('tab', { name: /Movimientos/u }).click()
  await expect(page.getByRole('tabpanel', { name: /Movimientos/u }).getByRole('row', { name: /Culantro/u }).first()).toContainText('+250 g')
  const culantro = (await api(local).list('/inventory/ingredients')).find((i) => i.name === 'Culantro')
  expect(culantro?.stock).toBe('350.000')
})

test('GES-09 el encargado arma una orden a mano, quita una línea y la cancela', async ({ page, local }) => {
  covers('funcion:compras.orden-a-mano', 'funcion:compras.cancelar')
  await api(local).post('/inventory/suppliers', { name: 'Distribuidora Norte', contact: '', phone: '', notes: '', is_active: true })
  await openAs(page, local.owner, '/inventario?vista=compras')
  const purchases = page.getByRole('tabpanel', { name: /Compras/u })

  // Cancelar la ventana no crea nada.
  await purchases.getByRole('button', { name: 'Nueva orden' }).click()
  const order = page.getByRole('dialog', { name: 'Nueva orden de compra' })
  await order.getByRole('button', { name: 'Cancelar' }).click()
  await expect(order).toBeHidden()
  await expect(purchases.getByText('Todavía no hay órdenes de compra')).toBeVisible()

  await purchases.getByRole('button', { name: 'Nueva orden' }).click()
  await order.getByLabel('Proveedor').selectOption({ label: 'Distribuidora Norte' })
  await order.getByLabel('Insumo de la línea 1').selectOption({ label: 'Cebolla roja' })
  await order.getByLabel('Cantidad en g').fill('2000')
  await order.getByLabel('Costo por unidad').fill('0.0035')
  await order.getByRole('button', { name: 'Agregar insumo' }).click()
  await order.getByLabel('Insumo de la línea 2').selectOption({ label: 'Lomo de res' })
  await expect(order.getByRole('button', { name: 'Crear orden' })).toBeDisabled()
  await order.getByRole('button', { name: 'Quitar la línea 2' }).click()
  await expect(order.getByLabel('Insumo de la línea 2')).toBeHidden()
  await evidence(page, 'ges-09-1-orden-a-mano')
  await order.getByRole('button', { name: 'Crear orden' }).click()
  await expect(notice(page, /Orden de compra 1 creada \(S\/\s*7\.00\)\./u)).toBeVisible()

  const oc = purchases.getByRole('listitem').filter({ hasText: 'OC 1 · Distribuidora Norte' })
  await oc.getByRole('button', { name: 'Cancelar' }).click()
  await expect(notice(page, 'Orden 1: cancelada.')).toBeVisible()
  await expect(oc).toContainText('Cancelada')
  await expect(oc.getByRole('button')).toHaveCount(0)
  const orders = await api(local).list('/inventory/purchase-orders')
  expect(orders[0]).toMatchObject({ status: 'cancelled', estimated_total: '7.00' })
})
