// HU14, HU28, HU29, HU27, HU32: el cobro de un pedido servido. Cuenta
// dividida en partes iguales o por platos, pago mixto con vuelto, descuento
// con tope del mesero, cortesías del encargado y el ticket impreso.
import type { Locator, Page } from '@playwright/test'

import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'
import { contarImpresiones, id, impresiones, leerPedido, pedidoServido } from '../soporte/salon'

const soles = (monto: string) => new RegExp(`S/\\s*${monto.replace('.', '\\.')}`, 'u')

// Con la ventana de cobro abierta, Radix marca el resto de la página con
// `aria-hidden` y el aviso emergente no se ve por su rol (HALLAZGO-salon-1):
// se busca por su texto.
const avisoTras = (page: Page, texto: string | RegExp) => page.getByLabel('Avisos del sistema', { exact: true }).getByText(texto)

async function abrirCobro(page: Page, numero: number): Promise<Locator> {
  await page.getByRole('button', { name: 'Cobrar' }).click()
  const ventana = page.getByRole('dialog', { name: `Cobrar pedido #${String(numero)}` })
  await expect(ventana).toBeVisible()
  return ventana
}

/** Las fichas son radios nativos ocultos: se toca su etiqueta, como con el dedo. */
async function elegir(ventana: Locator, opcion: string): Promise<void> {
  await ventana.getByText(opcion, { exact: true }).click()
  await expect(ventana.getByRole('radio', { name: opcion })).toBeChecked()
}

test('SAL-17 el mesero cobra en partes iguales con pago mixto: efectivo con vuelto y Yape con propina @movil', async ({
  page,
  localConCaja: local,
}) => {
  cubre(
    'dialogo:orders/charge/ChargeContent',
    'funcion:cobro.partes-iguales',
    'funcion:cobro.pago-mixto',
    'funcion:cobro.vuelto',
    'funcion:cobro.propina',
    'funcion:cobro.monto-insuficiente',
  )
  const pedido = await pedidoServido(local, local.mesa('1'), [
    { plato: local.plato('Lomo saltado'), cantidad: 2 },
    { plato: local.plato('Inca Kola 500 ml') },
  ])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirCobro(page, 1)
  await expect(ventana).toContainText(/Total a cobrar\s*S\/\s*70\.00/u)

  await elegir(ventana, 'Partes iguales')
  await expect(ventana).toContainText(/Paga cada una\s*S\/\s*35\.00/u)
  await expect(ventana.getByRole('radio', { name: 'Efectivo' })).toBeChecked()
  const recibido = ventana.getByRole('textbox', { name: 'Monto recibido' })
  await recibido.fill('20')
  await ventana.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(ventana.getByText('El monto no cubre lo que se cobra')).toBeVisible()
  await ventana.getByRole('group', { name: 'Montos rápidos' }).getByRole('button', { name: soles('50.00') }).click()
  await expect(ventana).toContainText(/Vuelto\s*S\/\s*15\.00/u)
  await evidencia(page, 'sal-17-1-primera-parte')
  await ventana.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(avisoTras(page, /Pago registrado\. Faltan S\/\s*35\.00\./u)).toBeVisible()

  // La segunda persona paga lo que falta con Yape y deja propina.
  await expect(ventana).toContainText(/Falta cobrar\s*S\/\s*35\.00/u)
  await expect(ventana).toContainText(/Paga lo que falta\s*S\/\s*35\.00/u)
  await expect(ventana.getByRole('region', { name: 'Pagos registrados' })).toContainText('Efectivo')
  await elegir(ventana, 'Yape')
  await expect(recibido).toBeHidden()
  await ventana.getByRole('group', { name: 'Propinas rápidas' }).getByRole('button', { name: soles('5.00') }).click()
  await expect(ventana.getByRole('textbox', { name: 'Propina (opcional)' })).toHaveValue('5')
  await evidencia(page, 'sal-17-2-segunda-parte')
  await ventana.getByRole('button', { name: 'Confirmar pago' }).click()

  const recibo = page.getByRole('dialog', { name: 'Cobro registrado' })
  await expect(recibo).toContainText('Pedido #1 pagado · Mixto')
  await expect(recibo).toContainText(/Propinas\s*S\/\s*5\.00/u)
  await expect(recibo.getByRole('region', { name: 'Pagos registrados' }).getByRole('listitem')).toHaveCount(2)
  await evidencia(page, 'sal-17-3-cobrado')
  await recibo.getByRole('button', { name: 'Terminar' }).click()
  await expect(recibo).toBeHidden()
  await expect(page.getByText('Pagado', { exact: true }).first()).toBeVisible()

  const pagado = await leerPedido(local, id(pedido))
  expect(pagado).toMatchObject({ status: 'paid', balance: '0.00', tips: '5.00', payment_method_label: 'Mixto' })
  expect(pagado.payments).toEqual([
    expect.objectContaining({ method: 'cash', amount: '35.00', amount_received: '50.00', change: '15.00', tip: '0.00' }),
    expect.objectContaining({ method: 'yape', amount: '35.00', tip: '5.00' }),
  ])
})

test('SAL-18 el mesero cobra por platos: uno paga su lomo con tarjeta y otro el resto en efectivo exacto @movil', async ({
  page,
  localConCaja: local,
}) => {
  cubre('funcion:cobro.por-platos', 'funcion:cobro.monto-exacto')
  const pedido = await pedidoServido(local, local.mesa('2'), [
    { plato: local.plato('Lomo saltado') },
    { plato: local.plato('Ceviche clásico') },
    { plato: local.plato('Chicha morada') },
  ])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirCobro(page, 1)
  await elegir(ventana, 'Por platos')
  await expect(ventana.getByText('Elige al menos un plato')).toBeVisible()
  await expect(ventana.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled()

  await ventana.getByRole('checkbox', { name: /Lomo saltado/u }).click()
  await expect(ventana.getByText('Paga, con el descuento del pedido')).toBeVisible()
  await expect(ventana.getByRole('group', { name: 'Platos que paga' })).toContainText(soles('32.00'))
  await elegir(ventana, 'Tarjeta')
  await evidencia(page, 'sal-18-1-por-platos')
  await ventana.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(avisoTras(page, /Pago registrado\. Faltan S\/\s*36\.00\./u)).toBeVisible()

  // El lomo ya pagado no se vuelve a ofrecer.
  await expect(ventana.getByRole('checkbox', { name: /Lomo saltado/u })).toHaveCount(0)
  await ventana.getByRole('checkbox', { name: /Ceviche clásico/u }).click()
  await ventana.getByRole('checkbox', { name: /Chicha morada/u }).click()
  await elegir(ventana, 'Efectivo')
  await ventana.getByRole('button', { name: 'Monto exacto' }).click()
  await expect(ventana.getByRole('textbox', { name: 'Monto recibido' })).toHaveValue('36.00')
  await expect(ventana).toContainText(/Vuelto\s*S\/\s*0\.00/u)
  await ventana.getByRole('button', { name: 'Confirmar pago' }).click()
  await expect(page.getByRole('dialog', { name: 'Cobro registrado' })).toContainText('Pedido #1 pagado')

  const pagado = await leerPedido(local, id(pedido))
  expect(pagado.status).toBe('paid')
  expect((pagado.payments as { method: string; amount: string }[]).map((p) => [p.method, p.amount])).toEqual([
    ['card', '32.00'],
    ['cash', '36.00'],
  ])
})

test('SAL-19 el mesero descuenta hasta su tope, y más allá el servidor lo rechaza @movil', async ({
  page,
  localConCaja: local,
}) => {
  cubre('funcion:cobro.descuento', 'funcion:cobro.descuento-sobre-tope', 'funcion:cobro.quitar-descuento')
  const pedido = await pedidoServido(local, local.mesa('3'), [{ plato: local.plato('Ceviche clásico'), cantidad: 2 }])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirCobro(page, 1)
  // Las cortesías son del encargado: el mesero no las ve.
  await expect(ventana.getByText('Invitar un plato (cortesía)')).toHaveCount(0)

  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(ventana.getByText(/Hasta 10(\.0+)?\s*%; más, lo aplica el encargado\./u)).toBeVisible()
  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(ventana.getByText('Escribe el motivo')).toBeVisible()
  await ventana.getByRole('textbox', { name: 'Descuento %' }).fill('20')
  await ventana.getByRole('textbox', { name: 'Motivo' }).fill('Demora en cocina')
  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(avisoTras(page, 'Tu descuento máximo es 10.00 %. Uno mayor, o una cortesía, lo aplica el encargado.')).toBeVisible()
  expect((await leerPedido(local, id(pedido))).discount_percent).toBe('0.00')

  await ventana.getByRole('textbox', { name: 'Descuento %' }).fill('10')
  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(avisoTras(page, /Descuento de 10(\.0+)?\s*% aplicado\./u)).toBeVisible()
  await expect(ventana).toContainText(/Descuento 10(\.0+)?\s*%\s*− S\/\s*5\.60/u)
  await expect(ventana).toContainText(/Total a cobrar\s*S\/\s*50\.40/u)
  await evidencia(page, 'sal-19-1-descuento')

  await ventana.getByRole('button', { name: 'Quitar descuento' }).click()
  await expect(avisoTras(page, 'Descuento quitado.')).toBeVisible()
  await expect(ventana).toContainText(/Total a cobrar\s*S\/\s*56\.00/u)
  await ventana.getByRole('button', { name: 'Volver' }).click()
  await expect(ventana).toBeHidden()
})

test('SAL-20 el encargado invita un plato, descuenta sin tope, cobra e imprime el ticket', async ({
  page,
  localConCaja: local,
}) => {
  cubre(
    'desplegable:orders/charge/AdjustmentsPanel',
    'funcion:cobro.cortesia',
    'funcion:cobro.quitar-cortesia',
    'funcion:cobro.descuento-sin-tope',
    'funcion:cobro.todo-junto',
    'funcion:pedido.imprimir-ticket',
  )
  await contarImpresiones(page)
  const pedido = await pedidoServido(local, local.mesa('4'), [
    { plato: local.plato('Lomo saltado') },
    { plato: local.plato('Chicha morada') },
  ])
  await abrirComo(page, local.encargado, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirCobro(page, 1)

  const cortesias = ventana.getByText('Invitar un plato (cortesía)')
  await cortesias.click()
  const chicha = ventana.getByRole('listitem').filter({ hasText: '1 × Chicha morada' })
  await chicha.getByRole('button', { name: 'Invitar' }).click()
  const motivo = chicha.getByRole('textbox', { name: 'Motivo de la cortesía de Chicha morada' })
  await expect(chicha.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  await motivo.fill('Cumpleaños')
  await chicha.getByRole('button', { name: 'Confirmar' }).click()
  await expect(chicha).toContainText('Invita la casa: Cumpleaños')
  await expect(ventana).toContainText(/Cortesías\s*− S\/\s*8\.00/u)
  await evidencia(page, 'sal-20-1-cortesia')

  // Se puede volver a cobrar, y otra vez invitar.
  await chicha.getByRole('button', { name: 'Cobrar' }).click()
  await expect(chicha).not.toContainText('Invita la casa')
  await expect(ventana).toContainText(/Total a cobrar\s*S\/\s*40\.00/u)
  await chicha.getByRole('button', { name: 'Invitar' }).click()
  await motivo.fill('Cumpleaños')
  await chicha.getByRole('button', { name: 'Confirmar' }).click()
  await expect(chicha).toContainText('Invita la casa: Cumpleaños')

  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(ventana.getByText('Sin tope: lo aplicas como encargado.')).toBeVisible()
  await ventana.getByRole('textbox', { name: 'Descuento %' }).fill('25')
  await ventana.getByRole('textbox', { name: 'Motivo' }).fill('Cliente frecuente')
  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(ventana).toContainText(/Total a cobrar\s*S\/\s*24\.00/u)
  await expect(ventana.getByRole('button', { name: /Cambiar descuento \(25(\.0+)?\s*%\)/u })).toBeVisible()

  await ventana.getByRole('group', { name: 'Montos rápidos' }).getByRole('button', { name: soles('50.00') }).click()
  await ventana.getByRole('button', { name: 'Confirmar pago' }).click()
  const recibo = page.getByRole('dialog', { name: 'Cobro registrado' })
  await expect(recibo).toContainText(/Vuelto\s*S\/\s*26\.00/u)
  await evidencia(page, 'sal-20-2-vuelto')
  await recibo.getByRole('button', { name: 'Terminar' }).click()

  await expect(page.getByText('Cortesías', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Imprimir ticket' }).click()
  const hoja = page.locator('#hoja-impresa')
  await expect(hoja).toContainText('Ticket de venta')
  await expect(hoja).toContainText('1 × Chicha morada (cortesía)')
  await expect(hoja).toContainText(/Cortesías\s*− S\/\s*8\.00/u)
  await expect(hoja).toContainText(/Descuento 25(\.0+)?\s*%\s*− S\/\s*8\.00/u)
  await expect(hoja).toContainText(/Total\s*S\/\s*24\.00/u)
  await expect(hoja).toContainText(/Vuelto\s*S\/\s*26\.00/u)
  await expect.poll(() => impresiones(page)).toBe(1)
  await evidencia(page, 'sal-20-3-ticket')
  expect(await leerPedido(local, id(pedido))).toMatchObject({ status: 'paid', courtesy_amount: '8.00', total: '24.00' })
})

test('SAL-21 sin caja abierta el cobro avisa y no deja confirmar @movil', async ({ page, local }) => {
  cubre('estado:cobro.caja-cerrada')
  const pedido = await pedidoServido(local, local.mesa('1'), [{ plato: local.plato('Chicha morada') }])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirCobro(page, 1)
  await expect(ventana.getByRole('alert')).toContainText('La caja está cerrada.')
  await expect(ventana.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled()
  await evidencia(page, 'sal-21-1-caja-cerrada')
  await ventana.getByRole('button', { name: 'Volver' }).click()
  await expect(ventana).toBeHidden()
  expect((await leerPedido(local, id(pedido))).status).toBe('served')
})

test('SAL-40 el rechazo de un descuento se anuncia aunque la ventana de cobro esté abierta @movil', async ({
  page,
  localConCaja: local,
}) => {
  const pedido = await pedidoServido(local, local.mesa('1'), [{ plato: local.plato('Ceviche clásico') }])
  await abrirComo(page, local.mesero, `/pedidos/${String(pedido.id)}`)
  const ventana = await abrirCobro(page, 1)
  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await ventana.getByRole('textbox', { name: 'Descuento %' }).fill('20')
  await ventana.getByRole('textbox', { name: 'Motivo' }).fill('Demora en cocina')
  await ventana.getByRole('button', { name: 'Aplicar descuento' }).click()
  await expect(avisoTras(page, /Tu descuento máximo es 10/u)).toBeVisible()
  await expect(page.getByRole('status', { name: 'Avisos del sistema' })).toContainText('Tu descuento máximo es 10')
  await evidencia(page, 'sal-40-aviso-sobre-el-velo')
})
