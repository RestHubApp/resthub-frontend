// Regresión visual del salón: las mesas, la toma de pedido, el detalle de un
// pedido con sus ventanas, el cobro, la cocina y la comanda impresa.
import { countPrints, id } from '../soporte/gestion'
import { covers } from '../soporte/cobertura'
import { openAs } from '../soporte/fixtures'
import { capture, captureWindow, esMovil, expect, deadline, test } from './captura'
import { open, delivery, inKitchen, takeaway, dishWithOptions, served } from './preparar'

test('VIS-03 mesas, llevar y delivery, y la toma de pedido con opciones y resumen', async ({ page, local }) => {
  deadline(120_000)
  covers(
    'ruta:/pedidos',
    'pestanas:orders/OrdersView',
    'dialogo:orders/floor/TakeawayForm',
    'ruta:/pedidos/nuevo',
    'dialogo:orders/taking/ModifierDialog',
    'hoja:orders/taking/CartSheet',
  )
  const lomo = local.dish('Lomo saltado')
  await inKitchen(local, local.table('2'), [{ dish: lomo, quantity: 2 }, { dish: local.dish('Chicha morada') }])
  await takeaway(local, 'Rosa Huamán', [{ dish: local.dish('Ají de gallina') }])
  await delivery(local, 'Jorge Salas', [{ dish: local.dish('Ceviche clásico') }])
  await dishWithOptions(local)

  await openAs(page, local.waiter, '/pedidos')
  await expect(page.getByRole('heading', { name: '3 de 4 mesas libres' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await capture(page, 'pedidos-mesas')

  await page.getByRole('tab', { name: 'Llevar y delivery' }).click()
  await expect(page.getByText('Rosa Huamán')).toBeVisible()
  await expect(page.getByText('Jorge Salas')).toBeVisible()
  await capture(page, 'pedidos-llevar-y-delivery')

  await page.getByRole('tab', { name: 'Mis pedidos' }).click()
  await expect(page.getByRole('tab', { name: 'Mis pedidos' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Mesa 2').first()).toBeVisible()
  await capture(page, 'pedidos-mis-pedidos')

  await page.getByRole('button', { name: 'Para llevar / Delivery' }).click()
  const takeawayDialog = page.getByRole('dialog', { name: 'Pedido para llevar o delivery' })
  await captureWindow(takeawayDialog, 'dialogo-para-llevar')
  await takeawayDialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(takeawayDialog).toBeHidden()

  await page.getByRole('tab', { name: 'Mesas' }).click()
  await page.getByRole('link', { name: /Mesa 3.*Libre/u }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mesa 3' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Bistec a lo pobre/u })).toBeVisible()
  await capture(page, 'toma-de-pedido')

  await page.getByRole('button', { name: /^Bistec a lo pobre/u }).click()
  const options = page.getByRole('dialog', { name: 'Bistec a lo pobre' })
  await options.getByRole('button', { name: 'Jugoso' }).click()
  await options.getByRole('button', { name: /Huevo frito/u }).click()
  await captureWindow(options, 'dialogo-opciones-del-plato')
  await options.getByRole('button', { name: /Agregar ·/u }).click()
  await expect(options).toBeHidden()

  await page.getByRole('button', { name: /^Lomo saltado/u }).click()
  await page.getByRole('button', { name: /^Inca Kola/u }).click()
  const bar = page.getByRole('button', { name: /Ver y anotar/u })
  await expect(bar).toContainText('3 platos')
  await capture(page, 'toma-de-pedido-con-platos')

  await bar.click()
  const summary = page.getByRole('dialog', { name: 'Resumen · Mesa 3' })
  await expect(summary.getByText('Huevo frito')).toBeVisible()
  await captureWindow(summary, 'hoja-resumen-del-pedido')
  await summary.getByRole('button', { name: 'Seguir eligiendo' }).click()
  await expect(summary).toBeHidden()
  if (esMovil()) {
    await expect(bar).toBeVisible()
  }
})

test('VIS-04 el detalle del pedido con nota, cambio de mesa y platos agregados', async ({
  page,
  local,
}) => {
  deadline(120_000)
  covers(
    'ruta:/pedidos/:orderId',
    'dialogo:orders/detail/ItemNoteDialog',
    'dialogo:orders/detail/TablePickerDialog',
    'ruta:/pedidos/:orderId/agregar',
  )
  const order = await open(local, local.table('1'), [
    { dish: local.dish('Lomo saltado'), notes: 'Sin cebolla' },
    { dish: local.dish('Chicha morada'), quantity: 2 },
  ])
  const inProgress = await inKitchen(local, local.table('4'), [{ dish: local.dish('Ceviche clásico') }])

  await openAs(page, local.waiter, `/pedidos/${String(id(order))}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await expect(page.getByText('Sin cebolla')).toBeVisible()
  await capture(page, 'pedido-abierto')

  await page.getByRole('button', { name: 'Agregar nota' }).click()
  const note = page.getByRole('dialog', { name: 'Nota de Chicha morada' })
  await note.getByLabel('Nota para cocina').fill('Sin hielo')
  await captureWindow(note, 'dialogo-nota-del-plato')
  await note.getByRole('button', { name: 'Cancelar' }).click()
  await expect(note).toBeHidden()

  await page.getByRole('button', { name: 'Cambiar de mesa' }).click()
  const tables = page.getByRole('dialog', { name: 'Cambiar de mesa' })
  await expect(tables.getByRole('button', { name: /Mesa 2/u })).toBeVisible()
  await captureWindow(tables, 'dialogo-cambiar-de-mesa')
  await page.keyboard.press('Escape')
  await expect(tables).toBeHidden()

  await page.goto(`/pedidos/${String(id(inProgress))}/agregar`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #2 · Mesa 4' })).toBeVisible()
  await page.getByRole('button', { name: /^Ají de gallina/u }).click()
  await expect(page.getByRole('button', { name: 'Agregar al pedido' })).toBeEnabled()
  await capture(page, 'agregar-platos')
})

test('VIS-05 el cobro de un pedido servido, la comanda impresa y la cocina', async ({ page, restaurantWithCashRegister }) => {
  deadline(120_000)
  covers('dialogo:orders/charge/ChargeContent', 'ruta:/imprimir/:orderId/:kind', 'ruta:/cocina')
  const local = restaurantWithCashRegister
  const order = await served(local, local.table('3'), [
    { dish: local.dish('Lomo saltado') },
    { dish: local.dish('Inca Kola 500 ml'), quantity: 2 },
  ])
  await inKitchen(local, local.table('1'), [{ dish: local.dish('Ají de gallina'), notes: 'Poco ají' }])
  await countPrints(page)

  await openAs(page, local.waiter, `/pedidos/${String(id(order))}`)
  await expect(page.getByText('Servido, por cobrar').first()).toBeVisible()
  await capture(page, 'pedido-servido')

  await page.getByRole('button', { name: 'Cobrar' }).click()
  const charge = page.getByRole('dialog', { name: 'Cobrar pedido #1' })
  await charge.getByText('Tarjeta', { exact: true }).click()
  await captureWindow(charge, 'dialogo-cobro')
  await charge.getByRole('button', { name: 'Confirmar pago' }).click()
  const charged = page.getByRole('dialog', { name: 'Cobro registrado' })
  await captureWindow(charged, 'dialogo-cobro-registrado')
  await page.keyboard.press('Escape')
  await expect(charged).toBeHidden()
  await expect(page.getByText('Pagado').first()).toBeVisible()
  await capture(page, 'pedido-pagado')

  await page.goto(`/imprimir/${String(id(order))}/cuenta`)
  await expect(page.getByText('¡Gracias por su visita!')).toBeVisible()
  await capture(page, 'imprimir-precuenta')

  await page.goto(`/imprimir/${String(id(order))}/comanda`)
  await expect(page.getByText('Lomo saltado')).toBeVisible()
  await capture(page, 'imprimir-comanda')

  await page.goto('/cocina')
  await expect(page.getByRole('heading', { name: 'Por preparar (1)' })).toBeVisible()
  await expect(page.getByText('Poco ají')).toBeVisible()
  await capture(page, 'cocina')
})
