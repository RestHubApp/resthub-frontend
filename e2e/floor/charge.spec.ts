// HU14, HU28, HU29, HU27, HU32: el cobro de un pedido servido. Cuenta
// dividida en partes iguales o por platos, pago mixto con vuelto, descuento
// con tope del mesero, cortesías del encargado y el ticket impreso.
import type { Locator, Page } from '@playwright/test'

import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import { countPrints, id, prints, readOrder, orderServed } from '../support/floor'

// eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
const soles = (amount: string) => new RegExp(`S/\\s*${amount.replace('.', '\\.')}`, 'u')

// Con la ventana de cobro abierta, Radix marca el resto de la página con
// `aria-hidden` y el aviso emergente no se ve por su rol (HALLAZGO-salon-1):
// se busca por su texto.
const noticeAfter = (page: Page, text: string | RegExp) => page.getByLabel('Avisos del sistema', { exact: true }).getByText(text)

async function openCharge(page: Page, number: number): Promise<Locator> {
  await page.getByRole('button', { name: 'Cobrar' }).click()
  const dialog = page.getByRole('dialog', { name: `Cobrar pedido #${String(number)}` })
  await expect(dialog).toBeVisible()
  // A la vista solo el total, el medio de pago y Confirmar: lo demás está en «Más opciones».
  await expect(dialog.getByRole('radio', { name: 'Efectivo' })).toBeChecked()
  await expect(dialog.getByRole('button', { name: 'Confirmar pago' })).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: 'Monto recibido' })).toBeHidden()
  await dialog.getByRole('button', { name: /Más opciones/u }).click()
  await expect(dialog.getByRole('textbox', { name: 'Monto recibido' })).toBeVisible()
  return dialog
}

/** Las fichas son radios nativos ocultos: se toca su etiqueta, como con el dedo. */
async function select(dialog: Locator, option: string): Promise<void> {
  await dialog.getByText(option, { exact: true }).click()
  await expect(dialog.getByRole('radio', { name: option })).toBeChecked()
}

test('SAL-17 el mesero cobra en partes iguales con pago mixto: efectivo con vuelto y Yape con propina @mobile', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  covers(
    'dialogo:orders/charge/ChargeContent',
    'funcion:cobro.partes-iguales',
    'funcion:cobro.pago-mixto',
    'funcion:cobro.vuelto',
    'funcion:cobro.propina',
    'funcion:cobro.monto-insuficiente',
  )
  const order = await orderServed(local, local.table('1'), [
    { dish: local.dish('Lomo saltado'), quantity: 2 },
    { dish: local.dish('Inca Kola 500 ml') },
  ])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  const dialog = await openCharge(page, 1)
  await expect(dialog).toContainText(/Total a cobrar\s*S\/\s*70\.00/u)

  await select(dialog, 'Partes iguales')
  await expect(dialog).toContainText(/Paga cada una\s*S\/\s*35\.00/u)
  await expect(dialog.getByRole('radio', { name: 'Efectivo' })).toBeChecked()
  const received = dialog.getByRole('textbox', { name: 'Monto recibido' })
  await received.fill('20')
  await dialog.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(dialog.getByText('El monto no cubre lo que se cobra')).toBeVisible()
  await dialog.getByRole('group', { name: 'Montos rápidos' }).getByRole('button', { name: soles('50.00') }).click()
  await expect(dialog).toContainText(/Vuelto\s*S\/\s*15\.00/u)
  await evidence(page, 'sal-17-1-primera-parte')
  await dialog.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(noticeAfter(page, /Pago registrado\. Faltan S\/\s*35\.00\./u)).toBeVisible()

  // La segunda persona paga lo que falta con Yape y deja propina.
  await expect(dialog).toContainText(/Falta cobrar\s*S\/\s*35\.00/u)
  await expect(dialog).toContainText(/Paga lo que falta\s*S\/\s*35\.00/u)
  await expect(dialog.getByRole('region', { name: 'Pagos registrados' })).toContainText('Efectivo')
  await select(dialog, 'Yape')
  await expect(received).toBeHidden()
  await dialog.getByRole('group', { name: 'Propinas rápidas' }).getByRole('button', { name: soles('5.00') }).click()
  await expect(dialog.getByRole('textbox', { name: 'Propina (opcional)' })).toHaveValue('5')
  await evidence(page, 'sal-17-2-segunda-parte')
  await dialog.getByRole('button', { name: 'Confirmar pago' }).click()

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

test('SAL-18 el mesero cobra por platos: uno paga su lomo con tarjeta y otro el resto en efectivo exacto @mobile', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  covers('funcion:cobro.por-platos', 'funcion:cobro.monto-exacto')
  const order = await orderServed(local, local.table('2'), [
    { dish: local.dish('Lomo saltado') },
    { dish: local.dish('Ceviche clásico') },
    { dish: local.dish('Chicha morada') },
  ])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  const dialog = await openCharge(page, 1)
  await select(dialog, 'Por platos')
  await expect(dialog.getByText('Elige al menos un plato')).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled()

  await dialog.getByRole('checkbox', { name: /Lomo saltado/u }).click()
  await expect(dialog.getByText('Paga, con el descuento del pedido')).toBeVisible()
  await expect(dialog.getByRole('group', { name: 'Platos que paga' })).toContainText(soles('32.00'))
  await select(dialog, 'Tarjeta')
  await evidence(page, 'sal-18-1-por-platos')
  await dialog.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(noticeAfter(page, /Pago registrado\. Faltan S\/\s*36\.00\./u)).toBeVisible()

  // El lomo ya pagado no se vuelve a ofrecer.
  await expect(dialog.getByRole('checkbox', { name: /Lomo saltado/u })).toHaveCount(0)
  await dialog.getByRole('checkbox', { name: /Ceviche clásico/u }).click()
  await dialog.getByRole('checkbox', { name: /Chicha morada/u }).click()
  await select(dialog, 'Efectivo')
  await dialog.getByRole('button', { name: 'Monto exacto' }).click()
  await expect(dialog.getByRole('textbox', { name: 'Monto recibido' })).toHaveValue('36.00')
  await expect(dialog).toContainText(/Vuelto\s*S\/\s*0\.00/u)
  await dialog.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(page.getByRole('dialog', { name: 'Cobro registrado' })).toContainText('Pedido #1 pagado')

  const paid = await readOrder(local, id(order))
  expect(paid.status).toBe('paid')
  expect((paid.payments as { method: string; amount: string }[]).map((p) => [p.method, p.amount])).toEqual([
    ['card', '32.00'],
    ['cash', '36.00'],
  ])
})

test('SAL-19 el mesero descuenta hasta su tope, y más allá el servidor lo rechaza @mobile', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  covers('funcion:cobro.descuento', 'funcion:cobro.descuento-sobre-tope', 'funcion:cobro.quitar-descuento')
  const order = await orderServed(local, local.table('3'), [{ dish: local.dish('Ceviche clásico'), quantity: 2 }])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  const dialog = await openCharge(page, 1)
  // Las cortesías son del encargado: el mesero no las ve.
  await expect(dialog.getByText('Invitar un plato (cortesía)')).toHaveCount(0)

  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(dialog.getByText(/Hasta 10(\.0+)?\s*%; más, lo aplica el encargado\./u)).toBeVisible()
  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(dialog.getByText('Escribe el motivo')).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Descuento %' }).fill('20')
  await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Demora en cocina')
  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(noticeAfter(page, 'Tu descuento máximo es 10.00 %. Uno mayor, o una cortesía, lo aplica el encargado.')).toBeVisible()
  expect((await readOrder(local, id(order))).discount_percent).toBe('0.00')

  await dialog.getByRole('textbox', { name: 'Descuento %' }).fill('10')
  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(noticeAfter(page, /Descuento de 10(\.0+)?\s*% aplicado\./u)).toBeVisible()
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(dialog).toContainText(/Descuento 10(\.0+)?\s*%\s*− S\/\s*5\.60/u)
  await expect(dialog).toContainText(/Total a cobrar\s*S\/\s*50\.40/u)
  await evidence(page, 'sal-19-1-descuento')

  await dialog.getByRole('button', { name: 'Quitar descuento' }).click()
  await expect(noticeAfter(page, 'Descuento quitado.')).toBeVisible()
  await expect(dialog).toContainText(/Total a cobrar\s*S\/\s*56\.00/u)
  await dialog.getByRole('button', { name: 'Volver' }).click()
  await expect(dialog).toBeHidden()
})

test('SAL-20 el encargado invita un plato, descuenta sin tope, cobra e imprime el ticket', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  covers(
    'desplegable:orders/charge/CourtesyList',
    'funcion:cobro.cortesia',
    'funcion:cobro.quitar-cortesia',
    'funcion:cobro.descuento-sin-tope',
    'funcion:cobro.todo-junto',
    'funcion:pedido.imprimir-ticket',
  )
  await countPrints(page)
  const order = await orderServed(local, local.table('4'), [
    { dish: local.dish('Lomo saltado') },
    { dish: local.dish('Chicha morada') },
  ])
  await openAs(page, local.owner, `/pedidos/${String(order.id)}`)
  const dialog = await openCharge(page, 1)

  const courtesies = dialog.getByText('Invitar un plato (cortesía)')
  await courtesies.click()
  const chicha = dialog.getByRole('listitem').filter({ hasText: '1 × Chicha morada' })
  await chicha.getByRole('button', { name: 'Invitar' }).click()
  const reason = chicha.getByRole('textbox', { name: 'Motivo de la cortesía de Chicha morada' })
  await expect(chicha.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  await reason.fill('Cumpleaños')
  await chicha.getByRole('button', { name: 'Confirmar' }).click()
  await expect(chicha).toContainText('Invita la casa: Cumpleaños')
  await expect(dialog).toContainText(/Cortesías\s*− S\/\s*8\.00/u)
  await evidence(page, 'sal-20-1-cortesia')

  // Se puede volver a cobrar, y otra vez invitar.
  await chicha.getByRole('button', { name: 'Cobrar' }).click()
  await expect(chicha).not.toContainText('Invita la casa')
  await expect(dialog).toContainText(/Total a cobrar\s*S\/\s*40\.00/u)
  await chicha.getByRole('button', { name: 'Invitar' }).click()
  // Al reabrirlo, el formulario puede volver a montarse justo después de
  // escribir y perder el motivo: se reintenta hasta que Confirmar se habilite.
  await expect(async () => {
    await reason.fill('Cumpleaños')
    await expect(chicha.getByRole('button', { name: 'Confirmar' })).toBeEnabled({ timeout: 1000 })
  }).toPass()
  await chicha.getByRole('button', { name: 'Confirmar' }).click()
  await expect(chicha).toContainText('Invita la casa: Cumpleaños')

  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(dialog.getByText('Sin tope: lo aplicas como encargado.')).toBeVisible()
  await dialog.getByRole('textbox', { name: 'Descuento %' }).fill('25')
  await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Cliente frecuente')
  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(dialog).toContainText(/Total a cobrar\s*S\/\s*24\.00/u)
  // eslint-disable-next-line security/detect-unsafe-regex -- se aplica a textos cortos de la interfaz o del API de prueba, sin entradas externas
  await expect(dialog.getByRole('button', { name: /Cambiar descuento \(25(\.0+)?\s*%\)/u })).toBeVisible()

  await dialog.getByRole('group', { name: 'Montos rápidos' }).getByRole('button', { name: soles('50.00') }).click()
  await dialog.getByRole('button', { name: 'Confirmar pago' }).click()
  const receipt = page.getByRole('dialog', { name: 'Cobro registrado' })
  await expect(receipt).toContainText(/Vuelto\s*S\/\s*26\.00/u)
  await evidence(page, 'sal-20-2-vuelto')
  await receipt.getByRole('button', { name: 'Terminar' }).click()

  await expect(page.getByText('Cortesías', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Más acciones del pedido' }).click()
  await page.getByRole('menuitem', { name: 'Imprimir ticket' }).click()
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

test('SAL-21 sin caja abierta el cobro avisa y no deja confirmar @mobile', async ({ page, local }) => {
  covers('estado:cobro.caja-cerrada')
  const order = await orderServed(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  const dialog = await openCharge(page, 1)
  await expect(dialog.getByRole('alert')).toContainText('La caja está cerrada.')
  await expect(dialog.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled()
  await evidence(page, 'sal-21-1-caja-cerrada')
  await dialog.getByRole('button', { name: 'Volver' }).click()
  await expect(dialog).toBeHidden()
  expect((await readOrder(local, id(order))).status).toBe('served')
})

test('SAL-40 el rechazo de un descuento se anuncia aunque la ventana de cobro esté abierta @mobile', async ({
  page,
  restaurantWithCashRegister: local,
}) => {
  const order = await orderServed(local, local.table('1'), [{ dish: local.dish('Ceviche clásico') }])
  await openAs(page, local.waiter, `/pedidos/${String(order.id)}`)
  const dialog = await openCharge(page, 1)
  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  await dialog.getByRole('textbox', { name: 'Descuento %' }).fill('20')
  await dialog.getByRole('textbox', { name: 'Motivo' }).fill('Demora en cocina')
  await dialog.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(noticeAfter(page, /Tu descuento máximo es 10/u)).toBeVisible()
  await expect(page.getByRole('status', { name: 'Avisos del sistema' })).toContainText('Tu descuento máximo es 10')
  await evidence(page, 'sal-40-aviso-sobre-el-velo')
})
