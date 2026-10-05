// HU09, HU36: pedidos para llevar y delivery desde el celular. El delivery
// exige nombre, teléfono y dirección; el cliente frecuente se busca por nombre
// o teléfono, y uno nuevo queda en la libreta.
import type { Locator, Page } from '@playwright/test'

import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, id, leerPedido } from '../soporte/salon'

async function abrirParaLlevar(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Para llevar / Delivery' }).click()
  const ventana = page.getByRole('dialog', { name: 'Pedido para llevar o delivery' })
  await expect(ventana).toBeVisible()
  return ventana
}

async function enviarUnPlato(page: Page, plato: RegExp): Promise<void> {
  await page.getByRole('button', { name: plato }).click()
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(aviso(page, /enviado a cocina/u)).toBeVisible()
  await expect(page).toHaveURL(/\/pedidos$/u)
}

test('SAL-22 el mesero toma un pedido para llevar y lo encuentra en sus pestañas @movil', async ({ page, local }) => {
  cubre(
    'dialogo:orders/floor/TakeawayDialog',
    'pestanas:orders/OrdersView',
    'funcion:pedidos.para-llevar',
    'funcion:pedidos.pestana-llevar',
    'funcion:pedidos.pestana-mis-pedidos',
  )
  await abrirComo(page, local.mesero, '/pedidos')
  let ventana = await abrirParaLlevar(page)
  await ventana.getByRole('textbox', { name: 'Nombre del cliente (opcional)' }).fill('Borrador')
  await ventana.getByRole('button', { name: 'Cancelar' }).click()
  await expect(ventana).toBeHidden()

  ventana = await abrirParaLlevar(page)
  await expect(ventana.getByRole('radio', { name: 'Recoge en local' })).toHaveAttribute('aria-checked', 'true')
  await expect(ventana.getByRole('textbox', { name: 'Nombre del cliente (opcional)' })).toHaveValue('')
  await ventana.getByRole('textbox', { name: 'Nombre del cliente (opcional)' }).fill('Ana')
  await evidencia(page, 'sal-22-1-para-llevar')
  await ventana.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Para llevar · Ana' })).toBeVisible()
  await enviarUnPlato(page, /^Chicha morada/u)

  const pestanas = page.getByRole('tablist')
  await pestanas.getByRole('tab', { name: 'Llevar y delivery' }).click()
  await expect(page).toHaveURL(/vista=llevar/u)
  const llevar = page.getByRole('tabpanel', { name: 'Llevar y delivery' })
  await expect(llevar.getByRole('heading', { name: 'En curso (1)' })).toBeVisible()
  await expect(llevar.getByRole('link', { name: /#1.*Para llevar · Ana/u })).toContainText('En cocina')
  await evidencia(page, 'sal-22-2-pestana-llevar')

  await pestanas.getByRole('tab', { name: 'Mis pedidos' }).click()
  const mios = page.getByRole('tabpanel', { name: 'Mis pedidos' })
  await expect(mios.getByRole('link', { name: /Para llevar · Ana/u })).toBeVisible()
  // Volver atrás desde el pedido deja al mesero en la misma pestaña.
  await mios.getByRole('link', { name: /Para llevar · Ana/u }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await page.goBack()
  await expect(pestanas.getByRole('tab', { name: 'Mis pedidos' })).toHaveAttribute('aria-selected', 'true')
  await pestanas.getByRole('tab', { name: 'Mesas' }).click()
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()

  const [pedido] = await api(local, local.mesero).lista('/orders/active')
  expect(pedido).toMatchObject({ type: 'takeaway', customer_name: 'Ana', status: 'in_kitchen' })
})

test('SAL-23 un delivery exige nombre, teléfono y dirección, y el cliente nuevo queda en la libreta @movil', async ({
  page,
  local,
}) => {
  cubre('funcion:pedidos.delivery', 'funcion:pedidos.cliente-nuevo-a-libreta', 'funcion:pedido.datos-delivery')
  await abrirComo(page, local.mesero, '/pedidos')
  const ventana = await abrirParaLlevar(page)
  await ventana.getByRole('radio', { name: 'Delivery' }).click()
  await ventana.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(ventana.getByText('Escribe el nombre de quien recibe')).toBeVisible()
  await expect(ventana.getByText('Escribe un teléfono para coordinar la entrega')).toBeVisible()
  await expect(ventana.getByText('Escribe la dirección de entrega')).toBeVisible()
  await evidencia(page, 'sal-23-1-faltan-datos')

  await ventana.getByRole('textbox', { name: 'Nombre de quien recibe' }).fill('Luis Quispe')
  await ventana.getByRole('textbox', { name: 'Teléfono' }).fill('912345678')
  await ventana.getByRole('textbox', { name: 'Dirección de entrega' }).fill('Jr. Huallaga 450, Cercado')
  await ventana.getByRole('textbox', { name: 'Referencia (opcional)' }).fill('Puerta verde')
  // Ley N.º 29733: el cliente acepta quedar en la libreta.
  await ventana.getByRole('checkbox', { name: /Ley N\.º 29733/u }).click()
  await ventana.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Delivery · Luis Quispe' })).toBeVisible()
  await expect(page.getByText('Nuevo delivery a Jr. Huallaga 450, Cercado.')).toBeVisible()
  await enviarUnPlato(page, /^Ají de gallina/u)

  const clientes = await api(local).lista('/customers?q=912345678')
  expect(clientes).toEqual([expect.objectContaining({ name: 'Luis Quispe', address: 'Jr. Huallaga 450, Cercado' })])
  const [pedido] = await api(local, local.mesero).lista('/orders/active')
  expect(pedido).toMatchObject({ type: 'delivery', customer_phone: '912345678', customer_id: clientes[0].id })

  await page.goto(`/pedidos/${String(id(pedido))}`)
  const entrega = page.getByRole('region', { name: 'Entrega' })
  await expect(entrega).toContainText('Jr. Huallaga 450, Cercado')
  await expect(entrega).toContainText('Ref.: Puerta verde')
  await expect(entrega.getByRole('link', { name: '912345678' })).toHaveAttribute('href', 'tel:912345678')
  await evidencia(page, 'sal-23-2-detalle-delivery')
})

test('SAL-23B sin el consentimiento del cliente, el delivery sale igual y no queda en la libreta @movil', async ({
  page,
  local,
}) => {
  cubre('funcion:pedidos.delivery-sin-consentimiento')
  await abrirComo(page, local.mesero, '/pedidos')
  const ventana = await abrirParaLlevar(page)
  await ventana.getByRole('radio', { name: 'Delivery' }).click()
  await ventana.getByRole('textbox', { name: 'Nombre de quien recibe' }).fill('Marta Rojas')
  await ventana.getByRole('textbox', { name: 'Teléfono' }).fill('934567812')
  await ventana.getByRole('textbox', { name: 'Dirección de entrega' }).fill('Av. Grau 300, Barranco')
  await expect(ventana.getByRole('checkbox', { name: /Ley N\.º 29733/u })).not.toBeChecked()
  await ventana.getByRole('button', { name: 'Elegir platos' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Delivery · Marta Rojas' })).toBeVisible()
  await enviarUnPlato(page, /^Ají de gallina/u)

  expect(await api(local).lista('/customers?q=934567812')).toEqual([])
  const [pedido] = await api(local, local.mesero).lista('/orders/active')
  expect(pedido).toMatchObject({ type: 'delivery', customer_phone: '934567812', customer_id: null })
})

test('SAL-24 el mesero encuentra al cliente frecuente por nombre y no le vuelve a pedir los datos @movil', async ({
  page,
  local,
}) => {
  cubre('funcion:pedidos.buscar-cliente-frecuente', 'estado:pedidos.cliente-no-encontrado')
  const rosa = await api(local).post('/customers', {
    name: 'Rosa Pérez',
    phone: '999888777',
    email: '',
    address: 'Av. Brasil 1200, Magdalena',
    reference: 'Edificio azul',
    notes: '',
    consent: true,
  })
  await abrirComo(page, local.mesero, '/pedidos')
  const ventana = await abrirParaLlevar(page)
  await ventana.getByRole('radio', { name: 'Delivery' }).click()
  const buscar = ventana.getByRole('searchbox', { name: 'Buscar cliente frecuente (opcional)' })
  await buscar.fill('Zzz')
  await expect(ventana.getByText('No está en la libreta: escribe sus datos abajo.')).toBeVisible()
  await buscar.fill('Ros')
  const resultado = ventana.getByRole('button', { name: /Rosa Pérez/u })
  await expect(resultado).toContainText('999888777 · Av. Brasil 1200, Magdalena')
  await evidencia(page, 'sal-24-1-busqueda')
  await resultado.click()
  await expect(buscar).toHaveValue('')
  await expect(ventana.getByRole('textbox', { name: 'Nombre de quien recibe' })).toHaveValue('Rosa Pérez')
  await expect(ventana.getByRole('textbox', { name: 'Teléfono' })).toHaveValue('999888777')
  await expect(ventana.getByRole('textbox', { name: 'Dirección de entrega' })).toHaveValue('Av. Brasil 1200, Magdalena')
  await expect(ventana.getByRole('textbox', { name: 'Referencia (opcional)' })).toHaveValue('Edificio azul')
  await expect(ventana.getByRole('radio', { name: 'Delivery' })).toHaveAttribute('aria-checked', 'true')
  await ventana.getByRole('button', { name: 'Elegir platos' }).click()
  await enviarUnPlato(page, /^Lomo saltado/u)

  const [pedido] = await api(local, local.mesero).lista('/orders/active')
  expect(pedido).toMatchObject({ type: 'delivery', customer_id: rosa.id, delivery_address: 'Av. Brasil 1200, Magdalena' })
  expect((await leerPedido(local, id(pedido))).customer_name).toBe('Rosa Pérez')
  const libreta = await api(local).lista('/customers?q=Rosa')
  expect(libreta).toHaveLength(1)
})
