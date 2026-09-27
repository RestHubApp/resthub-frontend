// HU10, HU13, HU31, HU32: lo que el mesero y el encargado hacen con un pedido
// ya tomado: agregar platos, corregir uno abierto, cancelarlo con motivo,
// cambiarlo de mesa, unir otra mesa e imprimir la comanda y la precuenta.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, contarImpresiones, id, impresiones, leerPedido, pedidoAbierto, pedidoEnMesa, pedidoPagado } from '../soporte/salon'

const soles = (monto: string) => new RegExp(`S/\\s*${monto.replace('.', '\\.')}`, 'u')

test('SAL-10 el mesero agrega platos a un pedido listo y vuelve a cocina @movil', async ({ page, local }) => {
  cubre('ruta:/pedidos/:orderId/agregar', 'funcion:agregar.agregar-platos')
  const pedido = await pedidoEnMesa(local, local.mesa('1'), [{ plato: local.plato('Lomo saltado') }])
  await api(local, local.cocina).post(`/orders/${String(pedido.id)}/ready`)

  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Marcar servido' })).toBeVisible()
  await page.getByRole('link', { name: 'Agregar platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1 · Mesa 1' })).toBeVisible()
  await page.getByRole('button', { name: /^Ají de gallina/u }).click()
  await page.getByRole('button', { name: /^Inca Kola/u }).click()
  await evidencia(page, 'sal-10-1-agregar')
  await page.getByRole('button', { name: 'Agregar al pedido' }).click()

  await expect(aviso(page, 'Platos agregados al pedido #1.')).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`/pedidos/${String(pedido.id)}$`, 'u'))
  await expect(page.getByText('En cocina', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(soles('62.00')).first()).toBeVisible()
  await evidencia(page, 'sal-10-2-vuelve-a-cocina')
  const actual = await leerPedido(local, id(pedido))
  expect(actual).toMatchObject({ status: 'in_kitchen', total: '62.00', item_count: 3 })
})

test('SAL-11 un pedido pagado no admite más platos', async ({ page, localConCaja: local }) => {
  cubre('funcion:agregar.pedido-cerrado')
  const pedido = await pedidoPagado(local, local.mesa('1'), [{ plato: local.plato('Chicha morada') }])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}/agregar`)
  await expect(page.getByText('Este pedido ya está pagado: no admite más platos.')).toBeVisible()
  await evidencia(page, 'sal-11-1-cerrado')
})

test('SAL-12 un pedido que no se envió se corrige en el detalle y se envía desde ahí @movil', async ({ page, local }) => {
  cubre('dialogo:orders/detail/ItemNoteDialog', 'funcion:pedido.editar-plato', 'funcion:pedido.quitar-plato', 'funcion:pedido.enviar-pendiente')
  const pedido = await pedidoAbierto(local, local.mesa('2'), [
    { plato: local.plato('Lomo saltado') },
    { plato: local.plato('Inca Kola 500 ml') },
  ])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  await expect(page.getByText('Todavía no está en cocina')).toBeVisible()

  await page.getByRole('button', { name: 'Uno más de Lomo saltado' }).click()
  await expect(page.getByText(soles('64.00')).first()).toBeVisible()
  await page.getByRole('button', { name: 'Quitar Inca Kola 500 ml' }).click()
  await expect(aviso(page, 'Inca Kola 500 ml quitado del pedido.')).toBeVisible()

  // La nota: cancelar no guarda; guardar la deja en el plato.
  await page.getByRole('button', { name: 'Agregar nota' }).click()
  const ventana = page.getByRole('dialog', { name: 'Nota de Lomo saltado' })
  await ventana.getByRole('textbox', { name: 'Nota para cocina' }).fill('Algo que no va')
  await ventana.getByRole('button', { name: 'Cancelar' }).click()
  await expect(ventana).toBeHidden()
  await page.getByRole('button', { name: 'Agregar nota' }).click()
  await ventana.getByRole('textbox', { name: 'Nota para cocina' }).fill('Término medio')
  await evidencia(page, 'sal-12-1-nota')
  await ventana.getByRole('button', { name: 'Guardar nota' }).click()
  await expect(ventana).toBeHidden()
  await expect(page.getByText('Término medio')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cambiar nota' })).toBeVisible()

  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(aviso(page, 'Pedido #1 enviado a cocina.')).toBeVisible()
  await expect(page.getByText('En cocina: esta pantalla avisa sola cuando esté listo.')).toBeVisible()
  await evidencia(page, 'sal-12-2-enviado')
  const actual = await leerPedido(local, id(pedido))
  expect(actual).toMatchObject({ status: 'in_kitchen', total: '64.00' })
  expect(actual.items).toEqual([expect.objectContaining({ name: 'Lomo saltado', quantity: 2, notes: 'Término medio' })])
})

test('SAL-13 el encargado cancela un pedido con su motivo y la mesa queda libre', async ({ page, local }) => {
  cubre('dialogo:orders/CancelOrderDialog', 'funcion:pedido.cancelar')
  const pedido = await pedidoEnMesa(local, local.mesa('3'), [{ plato: local.plato('Ceviche clásico') }])
  await abrirComo(page, local.encargado, `/pedidos/${String(pedido.id)}`)
  await page.getByRole('button', { name: 'Cancelar pedido' }).click()
  const ventana = page.getByRole('dialog', { name: '¿Cancelar el pedido #1?' })
  await expect(ventana).toContainText('Mesa 3. La mesa queda libre')
  await ventana.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(ventana.getByText('Escribe el motivo')).toBeVisible()
  await ventana.getByRole('button', { name: 'Volver' }).click()
  await expect(ventana).toBeHidden()
  expect((await leerPedido(local, id(pedido))).status).toBe('in_kitchen')

  await page.getByRole('button', { name: 'Cancelar pedido' }).click()
  await ventana.getByRole('textbox', { name: 'Motivo' }).fill('El cliente se fue')
  await evidencia(page, 'sal-13-1-motivo')
  await ventana.getByRole('button', { name: 'Cancelar pedido' }).click()
  await expect(aviso(page, 'Pedido #1 cancelado.')).toBeVisible()
  await expect(page.getByText(/Cancelado el .*Motivo: El cliente se fue/u)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)
  await evidencia(page, 'sal-13-2-cancelado')
  expect(await leerPedido(local, id(pedido))).toMatchObject({ status: 'cancelled', cancel_reason: 'El cliente se fue' })
  await page.goto('/pedidos')
  await expect(page.getByRole('link', { name: /Mesa 3.*Libre/u })).toBeVisible()
})

test('SAL-14 el mesero no ve cómo cancelar un pedido @movil', async ({ page, local }) => {
  cubre('funcion:pedido.cancelar-sin-permiso')
  const pedido = await pedidoEnMesa(local, local.mesa('1'), [{ plato: local.plato('Chicha morada') }])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  await expect(page.getByRole('link', { name: 'Agregar platos' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancelar pedido' })).toHaveCount(0)
})

test('SAL-15 el mesero cambia el pedido de mesa y une otra mesa suya @movil', async ({ page, local }) => {
  cubre('dialogo:orders/detail/TablePickerDialog', 'funcion:pedido.cambiar-mesa', 'funcion:pedido.unir-mesa')
  const primero = await pedidoEnMesa(local, local.mesa('1'), [{ plato: local.plato('Lomo saltado') }])
  await pedidoEnMesa(local, local.mesa('2'), [{ plato: local.plato('Chicha morada'), cantidad: 2 }])
  await abrirComo(page, local.mesero, `/pedidos/${String(primero.id)}`)

  await page.getByRole('button', { name: 'Cambiar de mesa' }).click()
  const mover = page.getByRole('dialog', { name: 'Cambiar de mesa' })
  await expect(mover.getByRole('button', { name: /^Mesa/u })).toHaveText([/Mesa 3/u, /Mesa 4/u])
  await evidencia(page, 'sal-15-1-mesas-libres')
  await mover.getByRole('button', { name: 'Mesa 3' }).click()
  await expect(aviso(page, 'Pedido #1 ahora en Mesa 3.')).toBeVisible()
  await expect(mover).toBeHidden()
  await expect(page.getByText('Mesa 3', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Unir otra mesa' }).click()
  const unir = page.getByRole('dialog', { name: 'Unir otra mesa a esta' })
  await expect(unir.getByRole('button', { name: /Mesa 2/u })).toContainText(soles('16.00'))
  await unir.getByRole('button', { name: /Mesa 2/u }).click()
  await expect(aviso(page, 'Mesas unidas en el pedido #1.')).toBeVisible()
  await expect(page.getByText(soles('48.00')).first()).toBeVisible()
  await evidencia(page, 'sal-15-2-unidas')

  // Ya no quedan otras mesas con pedido para unir.
  await page.getByRole('button', { name: 'Unir otra mesa' }).click()
  await expect(unir.getByText('No tienes otras mesas con pedido')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(unir).toBeHidden()

  const actual = await leerPedido(local, id(primero))
  expect(actual).toMatchObject({ table_id: local.mesa('3').id, total: '48.00' })
  const mesas = await api(local).lista('/tables')
  const libres = mesas.filter((m) => m.active_order === null).map((m) => m.label)
  expect(libres).toEqual(['1', '2', '4'])
})

test('SAL-16 el mesero imprime la comanda sin precios y la precuenta @movil', async ({ page, local }) => {
  cubre('ruta:/imprimir/:orderId/:kind', 'funcion:pedido.imprimir-comanda', 'funcion:pedido.imprimir-precuenta', 'funcion:imprimir.reimprimir')
  await contarImpresiones(page)
  const pedido = await pedidoEnMesa(local, local.mesa('4'), [
    { plato: local.plato('Lomo saltado'), notas: 'Sin cebolla' },
    { plato: local.plato('Inca Kola 500 ml'), cantidad: 2 },
  ])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  await page.getByRole('link', { name: 'Imprimir comanda' }).click()
  const hoja = page.locator('#hoja-impresa')
  await expect(hoja).toContainText('Comanda')
  await expect(hoja).toContainText('#1')
  await expect(hoja).toContainText('Mesa 4')
  await expect(hoja).toContainText('1 × Lomo saltado')
  await expect(hoja).toContainText('» Sin cebolla')
  await expect(hoja).toContainText('2 × Inca Kola 500 ml')
  await expect(hoja).not.toContainText('S/')
  await expect.poll(() => impresiones(page)).toBe(1)
  await page.getByRole('button', { name: 'Imprimir' }).click()
  await expect.poll(() => impresiones(page)).toBe(2)
  await evidencia(page, 'sal-16-1-comanda')

  await page.getByRole('link', { name: 'Pedido', exact: true }).click()
  await page.getByRole('link', { name: 'Imprimir precuenta' }).click()
  await expect(hoja).toContainText('Precuenta')
  await expect(hoja).toContainText('Restaurante E2E')
  await expect(hoja).toContainText(/Total\s*S\/\s*44\.00/u)
  await expect(hoja).toContainText(soles('12.00'))
  await expect.poll(() => impresiones(page)).toBe(3)
  await evidencia(page, 'sal-16-2-precuenta')
})

test('SAL-36 el encargado lleva un pedido de cocina a cobrado desde el detalle', async ({ page, localConCaja: local }) => {
  cubre('funcion:pedido.marcar-listo')
  const pedido = await pedidoEnMesa(local, local.mesa('1'), [{ plato: local.plato('Ají de gallina') }])
  await abrirComo(page, local.encargado, `/pedidos/${String(pedido.id)}`)
  await page.getByRole('button', { name: 'Marcar listo' }).click()
  await expect(aviso(page, 'Pedido #1 listo.')).toBeVisible()
  await page.getByRole('button', { name: 'Marcar servido' }).click()
  await expect(aviso(page, 'Pedido #1 servido, por cobrar.')).toBeVisible()
  await page.getByRole('button', { name: 'Cobrar' }).click()
  const cobro = page.getByRole('dialog', { name: 'Cobrar pedido #1' })
  await cobro.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(page.getByRole('dialog', { name: 'Cobro registrado' })).toContainText('Pedido #1 pagado · Efectivo')
  expect((await leerPedido(local, id(pedido))).status).toBe('paid')
})

test('SAL-37 el mesero sirve un pedido que tomó otro, pero no lo cobra @movil', async ({ page, local }) => {
  cubre('funcion:pedido.cobrar-solo-lo-suyo')
  const pedido = await pedidoEnMesa(local, local.mesa('2'), [{ plato: local.plato('Chicha morada') }], local.encargado)
  await api(local).post(`/orders/${String(pedido.id)}/ready`)
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  await page.getByRole('button', { name: 'Marcar servido' }).click()
  await expect(aviso(page, 'Pedido #1 servido, por cobrar.')).toBeVisible()
  await expect(page.getByText('Servido, por cobrar: lo cobra quien lo atendió o el encargado.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cobrar' })).toHaveCount(0)
  await evidencia(page, 'sal-37-1-no-cobra')
})
