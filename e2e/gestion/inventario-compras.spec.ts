// HU34: proveedores y órdenes de compra. La orden se arma desde las
// sugerencias de reposición o a mano, se envía y al recibirla entra al stock
// con su costo real.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, soles } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-08 el encargado da de alta un proveedor, arma una orden desde las sugerencias, la envía y al recibirla entra al stock', async ({ page, local }) => {
  cubre(
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
  await abrirComo(page, local.encargado, '/inventario?vista=proveedores')
  const proveedores = page.getByRole('tabpanel', { name: /Proveedores/u })
  await expect(proveedores.getByText('Todavía no hay proveedores')).toBeVisible()
  await proveedores.getByRole('button', { name: 'Nuevo proveedor' }).click()
  const alta = page.getByRole('dialog', { name: 'Nuevo proveedor' })
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(alta.getByText('Escribe el nombre del proveedor')).toBeVisible()
  await alta.getByLabel('Nombre').fill('Mercado Mayorista')
  await alta.getByLabel('Contacto (opcional)').fill('Don Julio')
  await alta.getByLabel('Teléfono (opcional)').fill('987654321')
  await alta.getByLabel('Nota (opcional)').fill('Entrega martes y viernes')
  await evidencia(page, 'ges-08-1-proveedor')
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Proveedor «Mercado Mayorista» guardado.')).toBeVisible()
  const fila = proveedores.getByRole('listitem').filter({ hasText: 'Mercado Mayorista' })
  await expect(fila).toContainText('Don Julio · 987654321 · Entrega martes y viernes')

  await fila.getByRole('button', { name: 'Editar' }).click()
  const edicion = page.getByRole('dialog', { name: 'Editar Mercado Mayorista' })
  await expect(edicion.getByLabel('Contacto (opcional)')).toHaveValue('Don Julio')
  await edicion.getByLabel('Teléfono (opcional)').fill('912345678')
  await edicion.getByRole('button', { name: 'Guardar' }).click()
  await expect(edicion).toBeHidden()
  await expect(fila).toContainText('Don Julio · 912345678')

  // La orden: el Culantro está bajo su mínimo y viene sugerido.
  await page.getByRole('tab', { name: /Compras/u }).click()
  const compras = page.getByRole('tabpanel', { name: /Compras/u })
  await expect(compras.getByText('Todavía no hay órdenes de compra')).toBeVisible()
  await compras.getByRole('button', { name: 'Nueva orden' }).click()
  const orden = page.getByRole('dialog', { name: 'Nueva orden de compra' })
  const crear = orden.getByRole('button', { name: 'Crear orden' })
  await expect(crear).toBeDisabled()
  await orden.getByLabel('Proveedor').selectOption({ label: 'Mercado Mayorista' })
  await orden.getByRole('button', { name: 'Cargar sugerencias (1)' }).click()
  await expect(orden.getByLabel('Insumo de la línea 1')).toHaveValue(String(local.insumos[2].id))
  await expect(orden.getByLabel('Cantidad en g')).toHaveValue('300.000')
  await evidencia(page, 'ges-08-2-orden-sugerida')
  await crear.click()
  await expect(aviso(page, /Orden de compra 1 creada \(S\/\s*3\.60\)\./u)).toBeVisible()
  const oc1 = compras.getByRole('listitem').filter({ hasText: 'OC 1 · Mercado Mayorista' })
  await expect(oc1).toContainText('Borrador')
  await expect(oc1).toContainText('Culantro')
  await expect(oc1).toContainText(soles('3.60'))

  await oc1.getByRole('button', { name: 'Marcar enviada' }).click()
  await expect(aviso(page, 'Orden 1: enviada.')).toBeVisible()
  await expect(oc1).toContainText('Enviada')
  await expect(oc1.getByRole('button', { name: 'Marcar enviada' })).toBeHidden()

  // Llegó menos de lo pedido y más caro: se corrige al recibir.
  await oc1.getByRole('button', { name: 'Recibir' }).click()
  const recibir = page.getByRole('dialog', { name: 'Recibir la orden 1' })
  await expect(recibir).toContainText('Mercado Mayorista')
  await expect(recibir).toContainText('Pedido: 300 g')
  await recibir.getByLabel('Cantidad recibida de Culantro').fill('250')
  await recibir.getByLabel('Costo real por unidad de Culantro').fill('0.014')
  await evidencia(page, 'ges-08-3-recibir')
  await recibir.getByRole('button', { name: 'Recibir y cargar al stock' }).click()
  await expect(aviso(page, /Orden 1 recibida: S\/\s*3\.50 entraron al stock\./u)).toBeVisible()
  await expect(oc1).toContainText('Recibida')
  await expect(oc1).toContainText(/Recibido S\/\s*3\.50/u)
  await expect(oc1.getByRole('button', { name: 'Recibir' })).toBeHidden()

  // Lo recibido es una compra más del libro y la alerta se fue.
  await expect(page.getByText('Stock en orden: nada por debajo del mínimo.')).toBeVisible()
  await page.getByRole('tab', { name: /Movimientos/u }).click()
  await expect(page.getByRole('tabpanel', { name: /Movimientos/u }).getByRole('row', { name: /Culantro/u }).first()).toContainText('+250 g')
  const culantro = (await api(local).lista('/inventory/ingredients')).find((i) => i.name === 'Culantro')
  expect(culantro?.stock).toBe('350.000')
})

test('GES-09 el encargado arma una orden a mano, quita una línea y la cancela', async ({ page, local }) => {
  cubre('funcion:compras.orden-a-mano', 'funcion:compras.cancelar')
  await api(local).post('/inventory/suppliers', { name: 'Distribuidora Norte', contact: '', phone: '', notes: '', is_active: true })
  await abrirComo(page, local.encargado, '/inventario?vista=compras')
  const compras = page.getByRole('tabpanel', { name: /Compras/u })

  // Cancelar la ventana no crea nada.
  await compras.getByRole('button', { name: 'Nueva orden' }).click()
  const orden = page.getByRole('dialog', { name: 'Nueva orden de compra' })
  await orden.getByRole('button', { name: 'Cancelar' }).click()
  await expect(orden).toBeHidden()
  await expect(compras.getByText('Todavía no hay órdenes de compra')).toBeVisible()

  await compras.getByRole('button', { name: 'Nueva orden' }).click()
  await orden.getByLabel('Proveedor').selectOption({ label: 'Distribuidora Norte' })
  await orden.getByLabel('Insumo de la línea 1').selectOption({ label: 'Cebolla roja' })
  await orden.getByLabel('Cantidad en g').fill('2000')
  await orden.getByLabel('Costo por unidad').fill('0.0035')
  await orden.getByRole('button', { name: 'Agregar insumo' }).click()
  await orden.getByLabel('Insumo de la línea 2').selectOption({ label: 'Lomo de res' })
  await expect(orden.getByRole('button', { name: 'Crear orden' })).toBeDisabled()
  await orden.getByRole('button', { name: 'Quitar la línea 2' }).click()
  await expect(orden.getByLabel('Insumo de la línea 2')).toBeHidden()
  await evidencia(page, 'ges-09-1-orden-a-mano')
  await orden.getByRole('button', { name: 'Crear orden' }).click()
  await expect(aviso(page, /Orden de compra 1 creada \(S\/\s*7\.00\)\./u)).toBeVisible()

  const oc = compras.getByRole('listitem').filter({ hasText: 'OC 1 · Distribuidora Norte' })
  await oc.getByRole('button', { name: 'Cancelar' }).click()
  await expect(aviso(page, 'Orden 1: cancelada.')).toBeVisible()
  await expect(oc).toContainText('Cancelada')
  await expect(oc.getByRole('button')).toHaveCount(0)
  const ordenes = await api(local).lista('/inventory/purchase-orders')
  expect(ordenes[0]).toMatchObject({ status: 'cancelled', estimated_total: '7.00' })
})
