// Regresión visual del salón: las mesas, la toma de pedido, el detalle de un
// pedido con sus ventanas, el cobro, la cocina y la comanda impresa.
import { contarImpresiones, id } from '../soporte/gestion'
import { cubre } from '../soporte/cobertura'
import { abrirComo } from '../soporte/fixtures'
import { capturar, capturarVentana, esMovil, expect, plazo, test } from './captura'
import { abierto, delivery, enCocina, paraLlevar, platoConOpciones, servido } from './preparar'

test('VIS-03 mesas, llevar y delivery, y la toma de pedido con opciones y resumen', async ({ page, local }) => {
  plazo(120_000)
  cubre(
    'ruta:/pedidos',
    'pestanas:orders/OrdersView',
    'dialogo:orders/floor/TakeawayForm',
    'ruta:/pedidos/nuevo',
    'dialogo:orders/taking/ModifierDialog',
    'hoja:orders/taking/CartSheet',
  )
  const lomo = local.plato('Lomo saltado')
  await enCocina(local, local.mesa('2'), [{ plato: lomo, cantidad: 2 }, { plato: local.plato('Chicha morada') }])
  await paraLlevar(local, 'Rosa Huamán', [{ plato: local.plato('Ají de gallina') }])
  await delivery(local, 'Jorge Salas', [{ plato: local.plato('Ceviche clásico') }])
  await platoConOpciones(local)

  await abrirComo(page, local.mesero, '/pedidos')
  await expect(page.getByRole('heading', { name: '3 de 4 mesas libres' })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await capturar(page, 'pedidos-mesas')

  await page.getByRole('tab', { name: 'Llevar y delivery' }).click()
  await expect(page.getByText('Rosa Huamán')).toBeVisible()
  await expect(page.getByText('Jorge Salas')).toBeVisible()
  await capturar(page, 'pedidos-llevar-y-delivery')

  await page.getByRole('tab', { name: 'Mis pedidos' }).click()
  await expect(page.getByRole('tab', { name: 'Mis pedidos' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Mesa 2').first()).toBeVisible()
  await capturar(page, 'pedidos-mis-pedidos')

  await page.getByRole('button', { name: 'Para llevar / Delivery' }).click()
  const llevar = page.getByRole('dialog', { name: 'Pedido para llevar o delivery' })
  await capturarVentana(llevar, 'dialogo-para-llevar')
  await llevar.getByRole('button', { name: 'Cancelar' }).click()
  await expect(llevar).toBeHidden()

  await page.getByRole('tab', { name: 'Mesas' }).click()
  await page.getByRole('link', { name: /Mesa 3.*Libre/u }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mesa 3' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Bistec a lo pobre/u })).toBeVisible()
  await capturar(page, 'toma-de-pedido')

  await page.getByRole('button', { name: /^Bistec a lo pobre/u }).click()
  const opciones = page.getByRole('dialog', { name: 'Bistec a lo pobre' })
  await opciones.getByRole('button', { name: 'Jugoso' }).click()
  await opciones.getByRole('button', { name: /Huevo frito/u }).click()
  await capturarVentana(opciones, 'dialogo-opciones-del-plato')
  await opciones.getByRole('button', { name: /Agregar ·/u }).click()
  await expect(opciones).toBeHidden()

  await page.getByRole('button', { name: /^Lomo saltado/u }).click()
  await page.getByRole('button', { name: /^Inca Kola/u }).click()
  const barra = page.getByRole('button', { name: /Ver y anotar/u })
  await expect(barra).toContainText('3 platos')
  await capturar(page, 'toma-de-pedido-con-platos')

  await barra.click()
  const resumen = page.getByRole('dialog', { name: 'Resumen · Mesa 3' })
  await expect(resumen.getByText('Huevo frito')).toBeVisible()
  await capturarVentana(resumen, 'hoja-resumen-del-pedido')
  await resumen.getByRole('button', { name: 'Seguir eligiendo' }).click()
  await expect(resumen).toBeHidden()
  if (esMovil()) {
    await expect(barra).toBeVisible()
  }
})

test('VIS-04 el detalle del pedido con nota, cambio de mesa y platos agregados', async ({
  page,
  local,
}) => {
  plazo(120_000)
  cubre(
    'ruta:/pedidos/:orderId',
    'dialogo:orders/detail/ItemNoteDialog',
    'dialogo:orders/detail/TablePickerDialog',
    'ruta:/pedidos/:orderId/agregar',
  )
  const pedido = await abierto(local, local.mesa('1'), [
    { plato: local.plato('Lomo saltado'), notas: 'Sin cebolla' },
    { plato: local.plato('Chicha morada'), cantidad: 2 },
  ])
  const enCurso = await enCocina(local, local.mesa('4'), [{ plato: local.plato('Ceviche clásico') }])

  await abrirComo(page, local.mesero, `/pedidos/${String(id(pedido))}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await expect(page.getByText('Sin cebolla')).toBeVisible()
  await capturar(page, 'pedido-abierto')

  await page.getByRole('button', { name: 'Agregar nota' }).click()
  const nota = page.getByRole('dialog', { name: 'Nota de Chicha morada' })
  await nota.getByLabel('Nota para cocina').fill('Sin hielo')
  await capturarVentana(nota, 'dialogo-nota-del-plato')
  await nota.getByRole('button', { name: 'Cancelar' }).click()
  await expect(nota).toBeHidden()

  await page.getByRole('button', { name: 'Cambiar de mesa' }).click()
  const mesas = page.getByRole('dialog', { name: 'Cambiar de mesa' })
  await expect(mesas.getByRole('button', { name: /Mesa 2/u })).toBeVisible()
  await capturarVentana(mesas, 'dialogo-cambiar-de-mesa')
  await page.keyboard.press('Escape')
  await expect(mesas).toBeHidden()

  await page.goto(`/pedidos/${String(id(enCurso))}/agregar`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #2 · Mesa 4' })).toBeVisible()
  await page.getByRole('button', { name: /^Ají de gallina/u }).click()
  await expect(page.getByRole('button', { name: 'Agregar al pedido' })).toBeEnabled()
  await capturar(page, 'agregar-platos')
})

test('VIS-05 el cobro de un pedido servido, la comanda impresa y la cocina', async ({ page, localConCaja }) => {
  plazo(120_000)
  cubre('dialogo:orders/charge/ChargeContent', 'ruta:/imprimir/:orderId/:kind', 'ruta:/cocina')
  const local = localConCaja
  const pedido = await servido(local, local.mesa('3'), [
    { plato: local.plato('Lomo saltado') },
    { plato: local.plato('Inca Kola 500 ml'), cantidad: 2 },
  ])
  await enCocina(local, local.mesa('1'), [{ plato: local.plato('Ají de gallina'), notas: 'Poco ají' }])
  await contarImpresiones(page)

  await abrirComo(page, local.mesero, `/pedidos/${String(id(pedido))}`)
  await expect(page.getByText('Servido, por cobrar').first()).toBeVisible()
  await capturar(page, 'pedido-servido')

  await page.getByRole('button', { name: 'Cobrar' }).click()
  const cobro = page.getByRole('dialog', { name: 'Cobrar pedido #1' })
  await cobro.getByText('Tarjeta', { exact: true }).click()
  await capturarVentana(cobro, 'dialogo-cobro')
  await cobro.getByRole('button', { name: 'Confirmar pago' }).click()
  const cobrado = page.getByRole('dialog', { name: 'Cobro registrado' })
  await capturarVentana(cobrado, 'dialogo-cobro-registrado')
  await page.keyboard.press('Escape')
  await expect(cobrado).toBeHidden()
  await expect(page.getByText('Pagado').first()).toBeVisible()
  await capturar(page, 'pedido-pagado')

  await page.goto(`/imprimir/${String(id(pedido))}/cuenta`)
  await expect(page.getByText('¡Gracias por su visita!')).toBeVisible()
  await capturar(page, 'imprimir-precuenta')

  await page.goto(`/imprimir/${String(id(pedido))}/comanda`)
  await expect(page.getByText('Lomo saltado')).toBeVisible()
  await capturar(page, 'imprimir-comanda')

  await page.goto('/cocina')
  await expect(page.getByRole('heading', { name: 'Por preparar (1)' })).toBeVisible()
  await expect(page.getByText('Poco ají')).toBeVisible()
  await capturar(page, 'cocina')
})
