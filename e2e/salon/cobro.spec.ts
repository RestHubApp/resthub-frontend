// HU14, HU28, HU29, HU27, HU32: el cobro de un pedido servido. Cuenta
// dividida en partes iguales o por platos, pago mixto con vuelto, descuento
// con tope del mesero, cortesías del encargado y el ticket impreso.
import type { Locator, Page } from '@playwright/test'

import { covers } from '../soporte/cobertura'
import { openAs, evidence, expect, test } from '../soporte/fixtures'
import { countPrints, id, prints, readOrder, orderServed } from '../soporte/salon'

// eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
const soles = (amount: string) => new RegExp(`S/\\s*${amount.replace('.', '\\.')}`, 'u')

// Con la ventana de cobro abierta, Radix marca el resto de la página con
// `aria-hidden` y el aviso emergente no se ve por su rol (HALLAZGO-salon-1):
// se busca por su texto.
const noticeAfter = (page: Page, text: string | RegExp) => page.getByLabel('Avisos del sistema', { exact: true }).getByText(text)

async function openCharge(page: Page, number: number): Promise<Locator> {
  await page.getByRole('button', { name: 'Cobrar' }).click()
  const windowValue = page.getByRole('dialog', { name: `Cobrar pedido #${String(number)}` })
  await expect(windowValue).toBeVisible()
  return windowValue
}

/** Las fichas son radios nativos ocultos: se toca su etiqueta, como con el dedo. */
async function select(windowValue: Locator, option: string): Promise<void> {
  await windowValue.getByText(option, { exact: true }).click()
  await expect(windowValue.getByRole('radio', { name: option })).toBeChecked()
}

test('SAL-17 el mesero cobra en partes iguales con pago mixto: efectivo con vuelto y Yape con propina @movil', async ({
  page,
  localConCaja: local,
}) => {
  covers(
    'dialogo:orders/charge/ChargeContent',
    'funcion:cobro.partes-iguales',
    'funcion:cobro.pago-mixto',
    'funcion:cobro.vuelto',
    'funcion:cobro.propina',
    'funcion:cobro.monto-insuficiente',
  )
  const order = await orderServed(local, local.mesa('1'), [
    { plato: local.plato('Lomo saltado'), cantidad: 2 },
    { plato: local.plato('Inca Kola 500 ml') },
  ])
  await openAs(page, local.mesero, `/pedidos/${String(order.id)}`)
  const windowValue = await openCharge(page, 1)
  await expect(windowValue).toContainText(/Total a cobrar\s*S\/\s*70\.00/u)

  await select(windowValue, 'Partes iguales')
  await expect(windowValue).toContainText(/Paga cada una\s*S\/\s*35\.00/u)
  await expect(windowValue.getByRole('radio', { name: 'Efectivo' })).toBeChecked()
  const received = windowValue.getByRole('textbox', { name: 'Monto recibido' })
  await received.fill('20')
  await windowValue.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(windowValue.getByText('El monto no cubre lo que se cobra')).toBeVisible()
  await windowValue.getByRole('group', { name: 'Montos rápidos' }).getByRole('button', { name: soles('50.00') }).click()
  await expect(windowValue).toContainText(/Vuelto\s*S\/\s*15\.00/u)
  await evidence(page, 'sal-17-1-primera-parte')
  await windowValue.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(noticeAfter(page, /Pago registrado\. Faltan S\/\s*35\.00\./u)).toBeVisible()

  // La segunda persona paga lo que falta con Yape y deja propina.
  await expect(windowValue).toContainText(/Falta cobrar\s*S\/\s*35\.00/u)
  await expect(windowValue).toContainText(/Paga lo que falta\s*S\/\s*35\.00/u)
  await expect(windowValue.getByRole('region', { name: 'Pagos registrados' })).toContainText('Efectivo')
  await select(windowValue, 'Yape')
  await expect(received).toBeHidden()
  await windowValue.getByRole('group', { name: 'Propinas rápidas' }).getByRole('button', { name: soles('5.00') }).click()
  await expect(windowValue.getByRole('textbox', { name: 'Propina (opcional)' })).toHaveValue('5')
  await evidence(page, 'sal-17-2-segunda-parte')
  await windowValue.getByRole('button', { name: 'Confirmar pago' }).click()

  const receipt = page.getByRole('dialog', { name: 'Cobro registrado' })
  await expect(receipt).toContainText('Pedido #1 pagado · Mixto')
  await expect(receipt).toContainText(/Propinas\s*S\/\s*5\.00/u)
  await expect(receipt.getByRole('region', { name: 'Pagos registrados' }).getByRole('listitem')).toHaveCount(2)
  await evidence(page, 'sal-17-3-cobrado')
  await receipt.getByRole('button', { name: 'Terminar' }).click()
  await expect(receipt).toBeHidden()
  await expect(page.getByText('Pagado', { exact: true }).first()).toBeVisible()

  const paid = await readOrder(local, id(order))
  expect(paid).toMatchObject({ status: 'paid', balance: '0.00', tips: '5.00', payment_method_label: 'Mixto' })
  expect(paid.payments).toEqual([
    expect.objectContaining({ method: 'cash', amount: '35.00', amount_received: '50.00', change: '15.00', tip: '0.00' }),
    expect.objectContaining({ method: 'yape', amount: '35.00', tip: '5.00' }),
  ])
})

test('SAL-18 el mesero cobra por platos: uno paga su lomo con tarjeta y otro el resto en efectivo exacto @movil', async ({
  page,
  localConCaja: local,
}) => {
  covers('funcion:cobro.por-platos', 'funcion:cobro.monto-exacto')
  const order = await orderServed(local, local.mesa('2'), [
    { plato: local.plato('Lomo saltado') },
    { plato: local.plato('Ceviche clásico') },
    { plato: local.plato('Chicha morada') },
  ])
  await openAs(page, local.mesero, `/pedidos/${String(order.id)}`)
  const windowValue = await openCharge(page, 1)
  await select(windowValue, 'Por platos')
  await expect(windowValue.getByText('Elige al menos un plato')).toBeVisible()
  await expect(windowValue.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled()

  await windowValue.getByRole('checkbox', { name: /Lomo saltado/u }).click()
  await expect(windowValue.getByText('Paga, con el descuento del pedido')).toBeVisible()
  await expect(windowValue.getByRole('group', { name: 'Platos que paga' })).toContainText(soles('32.00'))
  await select(windowValue, 'Tarjeta')
  await evidence(page, 'sal-18-1-por-platos')
  await windowValue.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(noticeAfter(page, /Pago registrado\. Faltan S\/\s*36\.00\./u)).toBeVisible()

  // El lomo ya pagado no se vuelve a ofrecer.
  await expect(windowValue.getByRole('checkbox', { name: /Lomo saltado/u })).toHaveCount(0)
  await windowValue.getByRole('checkbox', { name: /Ceviche clásico/u }).click()
  await windowValue.getByRole('checkbox', { name: /Chicha morada/u }).click()
  await select(windowValue, 'Efectivo')
  await windowValue.getByRole('button', { name: 'Monto exacto' }).click()
  await expect(windowValue.getByRole('textbox', { name: 'Monto recibido' })).toHaveValue('36.00')
  await expect(windowValue).toContainText(/Vuelto\s*S\/\s*0\.00/u)
  await windowValue.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(page.getByRole('dialog', { name: 'Cobro registrado' })).toContainText('Pedido #1 pagado')

  const paid = await readOrder(local, id(order))
  expect(paid.status).toBe('paid')
  expect((paid.payments as { method: string; amount: string }[]).map((p) => [p.method, p.amount])).toEqual([
    ['card', '32.00'],
    ['cash', '36.00'],
  ])
})

test('SAL-19 el mesero descuenta hasta su tope, y más allá el servidor lo rechaza @movil', async ({
  page,
  localConCaja: local,
}) => {
  covers('funcion:cobro.descuento', 'funcion:cobro.descuento-sobre-tope', 'funcion:cobro.quitar-descuento')
  const order = await orderServed(local, local.mesa('3'), [{ plato: local.plato('Ceviche clásico'), cantidad: 2 }])
  await openAs(page, local.mesero, `/pedidos/${String(order.id)}`)
  const windowValue = await openCharge(page, 1)
  // Las cortesías son del encargado: el mesero no las ve.
  await expect(windowValue.getByText('Invitar un plato (cortesía)')).toHaveCount(0)

  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(windowValue.getByText(/Hasta 10(\.0+)?\s*%; más, lo aplica el encargado\./u)).toBeVisible()
  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(windowValue.getByText('Escribe el motivo')).toBeVisible()
  await windowValue.getByRole('textbox', { name: 'Descuento %' }).fill('20')
  await windowValue.getByRole('textbox', { name: 'Motivo' }).fill('Demora en cocina')
  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(noticeAfter(page, 'Tu descuento máximo es 10.00 %. Uno mayor, o una cortesía, lo aplica el encargado.')).toBeVisible()
  expect((await readOrder(local, id(order))).discount_percent).toBe('0.00')

  await windowValue.getByRole('textbox', { name: 'Descuento %' }).fill('10')
  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(noticeAfter(page, /Descuento de 10(\.0+)?\s*% aplicado\./u)).toBeVisible()
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(windowValue).toContainText(/Descuento 10(\.0+)?\s*%\s*− S\/\s*5\.60/u)
  await expect(windowValue).toContainText(/Total a cobrar\s*S\/\s*50\.40/u)
  await evidence(page, 'sal-19-1-descuento')

  await windowValue.getByRole('button', { name: 'Quitar descuento' }).click()
  await expect(noticeAfter(page, 'Descuento quitado.')).toBeVisible()
  await expect(windowValue).toContainText(/Total a cobrar\s*S\/\s*56\.00/u)
  await windowValue.getByRole('button', { name: 'Volver' }).click()
  await expect(windowValue).toBeHidden()
})

test('SAL-20 el encargado invita un plato, descuenta sin tope, cobra e imprime el ticket', async ({
  page,
  localConCaja: local,
}) => {
  covers(
    'desplegable:orders/charge/AdjustmentsPanel',
    'funcion:cobro.cortesia',
    'funcion:cobro.quitar-cortesia',
    'funcion:cobro.descuento-sin-tope',
    'funcion:cobro.todo-junto',
    'funcion:pedido.imprimir-ticket',
  )
  await countPrints(page)
  const order = await orderServed(local, local.mesa('4'), [
    { plato: local.plato('Lomo saltado') },
    { plato: local.plato('Chicha morada') },
  ])
  await openAs(page, local.encargado, `/pedidos/${String(order.id)}`)
  const windowValue = await openCharge(page, 1)

  const courtesies = windowValue.getByText('Invitar un plato (cortesía)')
  await courtesies.click()
  const chicha = windowValue.getByRole('listitem').filter({ hasText: '1 × Chicha morada' })
  await chicha.getByRole('button', { name: 'Invitar' }).click()
  const reason = chicha.getByRole('textbox', { name: 'Motivo de la cortesía de Chicha morada' })
  await expect(chicha.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  await reason.fill('Cumpleaños')
  await chicha.getByRole('button', { name: 'Confirmar' }).click()
  await expect(chicha).toContainText('Invita la casa: Cumpleaños')
  await expect(windowValue).toContainText(/Cortesías\s*− S\/\s*8\.00/u)
  await evidence(page, 'sal-20-1-cortesia')

  // Se puede volver a cobrar, y otra vez invitar.
  await chicha.getByRole('button', { name: 'Cobrar' }).click()
  await expect(chicha).not.toContainText('Invita la casa')
  await expect(windowValue).toContainText(/Total a cobrar\s*S\/\s*40\.00/u)
  await chicha.getByRole('button', { name: 'Invitar' }).click()
  await reason.fill('Cumpleaños')
  await chicha.getByRole('button', { name: 'Confirmar' }).click()
  await expect(chicha).toContainText('Invita la casa: Cumpleaños')

  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(windowValue.getByText('Sin tope: lo aplicas como encargado.')).toBeVisible()
  await windowValue.getByRole('textbox', { name: 'Descuento %' }).fill('25')
  await windowValue.getByRole('textbox', { name: 'Motivo' }).fill('Cliente frecuente')
  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(windowValue).toContainText(/Total a cobrar\s*S\/\s*24\.00/u)
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(windowValue.getByRole('button', { name: /Cambiar descuento \(25(\.0+)?\s*%\)/u })).toBeVisible()

  await windowValue.getByRole('group', { name: 'Montos rápidos' }).getByRole('button', { name: soles('50.00') }).click()
  await windowValue.getByRole('button', { name: 'Confirmar pago' }).click()
  const receipt = page.getByRole('dialog', { name: 'Cobro registrado' })
  await expect(receipt).toContainText(/Vuelto\s*S\/\s*26\.00/u)
  await evidence(page, 'sal-20-2-vuelto')
  await receipt.getByRole('button', { name: 'Terminar' }).click()

  await expect(page.getByText('Cortesías', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Imprimir ticket' }).click()
  const sheet = page.locator('#hoja-impresa')
  await expect(sheet).toContainText('Ticket de venta')
  await expect(sheet).toContainText('1 × Chicha morada (cortesía)')
  await expect(sheet).toContainText(/Cortesías\s*− S\/\s*8\.00/u)
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(sheet).toContainText(/Descuento 25(\.0+)?\s*%\s*− S\/\s*8\.00/u)
  await expect(sheet).toContainText(/Total\s*S\/\s*24\.00/u)
  await expect(sheet).toContainText(/Vuelto\s*S\/\s*26\.00/u)
  await expect.poll(() => prints(page)).toBe(1)
  await evidence(page, 'sal-20-3-ticket')
  expect(await readOrder(local, id(order))).toMatchObject({ status: 'paid', courtesy_amount: '8.00', total: '24.00' })
})

test('SAL-21 sin caja abierta el cobro avisa y no deja confirmar @movil', async ({ page, local }) => {
  covers('estado:cobro.caja-cerrada')
  const order = await orderServed(local, local.mesa('1'), [{ plato: local.plato('Chicha morada') }])
  await openAs(page, local.mesero, `/pedidos/${String(order.id)}`)
  const windowValue = await openCharge(page, 1)
  await expect(windowValue.getByRole('alert')).toContainText('La caja está cerrada.')
  await expect(windowValue.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled()
  await evidence(page, 'sal-21-1-caja-cerrada')
  await windowValue.getByRole('button', { name: 'Volver' }).click()
  await expect(windowValue).toBeHidden()
  expect((await readOrder(local, id(order))).status).toBe('served')
})

test('SAL-40 el rechazo de un descuento se anuncia aunque la ventana de cobro esté abierta @movil', async ({
  page,
  localConCaja: local,
}) => {
  const order = await orderServed(local, local.mesa('1'), [{ plato: local.plato('Ceviche clásico') }])
  await openAs(page, local.mesero, `/pedidos/${String(order.id)}`)
  const windowValue = await openCharge(page, 1)
  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  await windowValue.getByRole('textbox', { name: 'Descuento %' }).fill('20')
  await windowValue.getByRole('textbox', { name: 'Motivo' }).fill('Demora en cocina')
  await windowValue.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(noticeAfter(page, /Tu descuento máximo es 10/u)).toBeVisible()
  await expect(page.getByRole('status', { name: 'Avisos del sistema' })).toContainText('Tu descuento máximo es 10')
  await evidence(page, 'sal-40-aviso-sobre-el-velo')
})
