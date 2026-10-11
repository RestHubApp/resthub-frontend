// Regresión visual de lo que el encargado ve del día: el tablero, el
// historial, la cancelación, la caja, los comprobantes, las reservas y los
// clientes.
import { api, countPrints, issueSalesReceipt, today, id, sell } from '../soporte/gestion'
import { covers } from '../soporte/cobertura'
import { openAs } from '../soporte/fixtures'
import { capture, captureWindow, expect, deadline, test } from './captura'
import { inKitchen } from './preparar'

test('VIS-06 el tablero, el historial, la cancelación, el comprobante y la caja del encargado', async ({
  page,
  localConCaja: restaurantWithCashRegister,
}) => {
  deadline(150_000)
  covers(
    'ruta:/tablero',
    'ruta:/tablero/historial',
    'dialogo:orders/CancelOrderDialog',
    'dialogo:orders/invoice/InvoiceDialog',
    'ruta:/comprobantes',
    'ruta:/comprobantes/:invoiceId/imprimir',
    'ruta:/caja',
    'dialogo:cash/CashSessionDialog',
    'confirmacion:cash/CloseCashButton',
  )
  const local = restaurantWithCashRegister
  const lomo = local.plato('Lomo saltado')
  const first = await sell(local, { mesa: local.mesa('1'), items: [{ plato: lomo }, { plato: local.plato('Chicha morada') }] })
  const second = await sell(local, {
    mesa: local.mesa('2'),
    items: [{ plato: local.plato('Ceviche clásico'), cantidad: 2 }],
    metodo: 'yape',
    propina: '5.00',
  })
  const salesReceipt = await issueSalesReceipt(local, id(first))
  await inKitchen(local, local.mesa('3'), [{ plato: local.plato('Ají de gallina') }])
  // La hoja de impresión llama a `window.print()`: el diálogo del sistema no deja capturar en Firefox.
  await countPrints(page)

  await openAs(page, local.encargado, '/tablero')
  await expect(page.getByRole('region', { name: 'En cocina: 1' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await capture(page, 'tablero')

  await page.getByRole('button', { name: 'Cancelar pedido #3' }).click()
  const cancel = page.getByRole('dialog', { name: '¿Cancelar el pedido #3?' })
  await cancel.getByLabel('Motivo').fill('El cliente se fue')
  await captureWindow(cancel, 'dialogo-cancelar-pedido')
  await cancel.getByRole('button', { name: 'Volver' }).click()
  await expect(cancel).toBeHidden()

  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByText('3 en total')).toBeVisible()
  await capture(page, 'tablero-historial', { mask: [page.getByLabel('Desde'), page.getByLabel('Hasta')] })

  await page.goto(`/pedidos/${String(id(second))}`)
  await page.getByRole('button', { name: 'Emitir boleta o factura' }).click()
  const invoice = page.getByRole('dialog', { name: 'Comprobante del pedido #2' })
  await captureWindow(invoice, 'dialogo-comprobante')
  await invoice.getByRole('button', { name: 'Cancelar' }).click()
  await expect(invoice).toBeHidden()

  await page.goto('/comprobantes')
  await expect(page.getByRole('heading', { name: 'Emitidos' })).toBeVisible()
  await expect(page.getByText(String(salesReceipt.code))).toBeVisible()
  await capture(page, 'comprobantes')

  await page.goto(`/comprobantes/${String(id(salesReceipt))}/imprimir`)
  await expect(page.getByText(String(salesReceipt.code)).first()).toBeVisible()
  await capture(page, 'comprobante-imprimir')

  await page.goto('/caja')
  await expect(page.getByRole('heading', { name: 'Turno en curso' })).toBeVisible()
  await expect(page.getByText('Pedidos cobrados')).toBeVisible()
  await capture(page, 'caja')

  await page.getByLabel('Efectivo contado').fill('140.00')
  await page.getByRole('button', { name: 'Cerrar caja', exact: true }).click()
  const closing = page.getByRole('alertdialog', { name: '¿Cerrar la caja?' })
  await expect(closing).toContainText('S/ 140.00')
  await captureWindow(closing, 'confirmar-cerrar-caja')
  await closing.getByRole('button', { name: 'Cancelar' }).click()
  await expect(closing).toBeHidden()

  await page.getByRole('button', { name: /Abierta · abrió Encargada Prueba/u }).click()
  const shift = page.getByRole('dialog', { name: /^Turno de caja/u })
  await expect(shift.getByText('Cargando el arqueo…')).toBeHidden()
  // El número del turno es el id de la base: cambia con cada restaurante.
  await captureWindow(shift, 'dialogo-turno-de-caja', [shift.getByRole('heading', { name: /^Turno de caja/u })])
})

test('VIS-07 las reservas y los clientes con sus ventanas', async ({ page, local }) => {
  deadline(120_000)
  covers(
    'ruta:/reservas',
    'dialogo:reservations/ReservationDialog',
    'ruta:/clientes',
    'dialogo:customers/CustomerDialog',
    'hoja:customers/CustomerSheet',
    'confirmacion:customers/CustomerRights',
  )
  await api(local).post('/reservations', {
    customer_name: 'Lucía Paredes',
    phone: '987111222',
    party_size: 4,
    duration_minutes: 90,
    notes: 'Cumpleaños',
    reserved_for: `${today()}T20:00:00-05:00`,
    table_id: local.mesa('2').id,
  })
  await api(local).post('/customers', {
    consent: true,
    name: 'Ana Torres',
    phone: '999888777',
    email: 'ana@correo.pe',
    address: 'Jr. Junín 450',
    reference: 'Casa verde',
    notes: 'Prefiere la mesa de la ventana',
  })

  await openAs(page, local.encargado, '/reservas')
  await expect(page.getByText('Lucía Paredes')).toBeVisible()
  await capture(page, 'reservas', { mask: [page.getByLabel('Día')] })

  await page.getByRole('button', { name: 'Nueva reserva' }).click()
  const reservation = page.getByRole('dialog', { name: 'Nueva reserva' })
  await reservation.getByLabel('A nombre de').fill('Carlos Ruiz')
  await captureWindow(reservation, 'dialogo-reserva', [reservation.getByLabel('Día'), reservation.getByLabel('Hora')])
  await reservation.getByRole('button', { name: 'Cancelar' }).click()
  await expect(reservation).toBeHidden()

  await page.goto('/clientes')
  await expect(page.getByRole('heading', { name: '1 cliente' })).toBeVisible()
  await capture(page, 'clientes')

  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const registration = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await captureWindow(registration, 'dialogo-cliente')
  await registration.getByRole('button', { name: 'Cancelar' }).click()
  await expect(registration).toBeHidden()

  await page.getByRole('button', { name: /Ana Torres/u }).click()
  const card = page.getByRole('dialog', { name: 'Ana Torres' })
  await expect(card.getByText('Prefiere la mesa de la ventana')).toBeVisible()
  await captureWindow(card, 'hoja-cliente')

  await card.getByRole('button', { name: 'Borrar sus datos' }).click()
  const remove = page.getByRole('alertdialog', { name: '¿Borrar los datos de Ana Torres?' })
  await captureWindow(remove, 'confirmacion-borrar-cliente')
  await remove.getByRole('button', { name: 'Cancelar' }).click()
  await expect(remove).toBeHidden()
})
