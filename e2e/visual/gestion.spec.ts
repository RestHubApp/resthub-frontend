// Regresión visual de lo que el encargado ve del día: el tablero, el
// historial, la cancelación, la caja, los comprobantes, las reservas y los
// clientes.
import { api, contarImpresiones, emitirBoleta, hoy, id, vender } from '../soporte/gestion'
import { cubre } from '../soporte/cobertura'
import { abrirComo } from '../soporte/fixtures'
import { capturar, capturarVentana, expect, plazo, test } from './captura'
import { enCocina } from './preparar'

test('VIS-06 el tablero, el historial, la cancelación, el comprobante y la caja del encargado', async ({
  page,
  localConCaja,
}) => {
  plazo(150_000)
  cubre(
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
  const local = localConCaja
  const lomo = local.plato('Lomo saltado')
  const primera = await vender(local, { mesa: local.mesa('1'), items: [{ plato: lomo }, { plato: local.plato('Chicha morada') }] })
  const segunda = await vender(local, {
    mesa: local.mesa('2'),
    items: [{ plato: local.plato('Ceviche clásico'), cantidad: 2 }],
    metodo: 'yape',
    propina: '5.00',
  })
  const boleta = await emitirBoleta(local, id(primera))
  await enCocina(local, local.mesa('3'), [{ plato: local.plato('Ají de gallina') }])
  // La hoja de impresión llama a `window.print()`: el diálogo del sistema no deja capturar en Firefox.
  await contarImpresiones(page)

  await abrirComo(page, local.encargado, '/tablero')
  await expect(page.getByRole('region', { name: 'En cocina: 1' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await capturar(page, 'tablero')

  await page.getByRole('button', { name: 'Cancelar pedido #3' }).click()
  const cancelar = page.getByRole('dialog', { name: '¿Cancelar el pedido #3?' })
  await cancelar.getByLabel('Motivo').fill('El cliente se fue')
  await capturarVentana(cancelar, 'dialogo-cancelar-pedido')
  await cancelar.getByRole('button', { name: 'Volver' }).click()
  await expect(cancelar).toBeHidden()

  await page.getByRole('link', { name: 'Historial' }).click()
  await expect(page.getByText('3 en total')).toBeVisible()
  await capturar(page, 'tablero-historial', { mask: [page.getByLabel('Desde'), page.getByLabel('Hasta')] })

  await page.goto(`/pedidos/${String(id(segunda))}`)
  await page.getByRole('button', { name: 'Emitir boleta o factura' }).click()
  const comprobante = page.getByRole('dialog', { name: 'Comprobante del pedido #2' })
  await capturarVentana(comprobante, 'dialogo-comprobante')
  await comprobante.getByRole('button', { name: 'Cancelar' }).click()
  await expect(comprobante).toBeHidden()

  await page.goto('/comprobantes')
  await expect(page.getByRole('heading', { name: 'Emitidos' })).toBeVisible()
  await expect(page.getByText(String(boleta.code))).toBeVisible()
  await capturar(page, 'comprobantes')

  await page.goto(`/comprobantes/${String(id(boleta))}/imprimir`)
  await expect(page.getByText(String(boleta.code)).first()).toBeVisible()
  await capturar(page, 'comprobante-imprimir')

  await page.goto('/caja')
  await expect(page.getByRole('heading', { name: 'Turno en curso' })).toBeVisible()
  await expect(page.getByText('Pedidos cobrados')).toBeVisible()
  await capturar(page, 'caja')

  await page.getByLabel('Efectivo contado').fill('140.00')
  await page.getByRole('button', { name: 'Cerrar caja', exact: true }).click()
  const cierre = page.getByRole('alertdialog', { name: '¿Cerrar la caja?' })
  await expect(cierre).toContainText('S/ 140.00')
  await capturarVentana(cierre, 'confirmar-cerrar-caja')
  await cierre.getByRole('button', { name: 'Cancelar' }).click()
  await expect(cierre).toBeHidden()

  await page.getByRole('button', { name: /Abierta · abrió Encargada Prueba/u }).click()
  const turno = page.getByRole('dialog', { name: /^Turno de caja/u })
  await expect(turno.getByText('Cargando el arqueo…')).toBeHidden()
  // El número del turno es el id de la base: cambia con cada restaurante.
  await capturarVentana(turno, 'dialogo-turno-de-caja', [turno.getByRole('heading', { name: /^Turno de caja/u })])
})

test('VIS-07 las reservas y los clientes con sus ventanas', async ({ page, local }) => {
  plazo(120_000)
  cubre(
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
    reserved_for: `${hoy()}T20:00:00-05:00`,
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

  await abrirComo(page, local.encargado, '/reservas')
  await expect(page.getByText('Lucía Paredes')).toBeVisible()
  await capturar(page, 'reservas', { mask: [page.getByLabel('Día')] })

  await page.getByRole('button', { name: 'Nueva reserva' }).click()
  const reserva = page.getByRole('dialog', { name: 'Nueva reserva' })
  await reserva.getByLabel('A nombre de').fill('Carlos Ruiz')
  await capturarVentana(reserva, 'dialogo-reserva', [reserva.getByLabel('Día'), reserva.getByLabel('Hora')])
  await reserva.getByRole('button', { name: 'Cancelar' }).click()
  await expect(reserva).toBeHidden()

  await page.goto('/clientes')
  await expect(page.getByRole('heading', { name: '1 cliente' })).toBeVisible()
  await capturar(page, 'clientes')

  await page.getByRole('button', { name: 'Nuevo cliente' }).click()
  const alta = page.getByRole('dialog', { name: 'Nuevo cliente' })
  await capturarVentana(alta, 'dialogo-cliente')
  await alta.getByRole('button', { name: 'Cancelar' }).click()
  await expect(alta).toBeHidden()

  await page.getByRole('button', { name: /Ana Torres/u }).click()
  const ficha = page.getByRole('dialog', { name: 'Ana Torres' })
  await expect(ficha.getByText('Prefiere la mesa de la ventana')).toBeVisible()
  await capturarVentana(ficha, 'hoja-cliente')

  await ficha.getByRole('button', { name: 'Borrar sus datos' }).click()
  const borrar = page.getByRole('alertdialog', { name: '¿Borrar los datos de Ana Torres?' })
  await capturarVentana(borrar, 'confirmacion-borrar-cliente')
  await borrar.getByRole('button', { name: 'Cancelar' }).click()
  await expect(borrar).toBeHidden()
})
