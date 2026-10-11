// HU09, HU07, HU33: el mesero toma el pedido de una mesa desde el celular.
// Mesa, platos y «Enviar a cocina»; los platos agotados se ven pero no se
// eligen, y un plato con opciones pide el término antes de sumarse.
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import {
  api,
  countPrints,
  id,
  prints,
  readOrder,
  openOrder,
  orderInTable,
  dishWithOptions,
} from '../support/floor'

// eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
const soles = (amount: string) => new RegExp(`S/\\s*${amount.replace('.', '\\.')}`, 'u')

test('SAL-01 el mesero toma el pedido de una mesa en tres pasos y lo envía a cocina @mobile', async ({ page, local }) => {
  covers(
    'ruta:/pedidos',
    'ruta:/pedidos/nuevo',
    'funcion:pedidos.ver-mesas',
    'funcion:pedido-nuevo.agregar-plato',
    'funcion:pedido-nuevo.cambiar-cantidad',
    'funcion:pedido-nuevo.enviar-a-cocina',
  )
  await openAs(page, local.waiter, '/pedidos')
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()
  await evidence(page, 'sal-01-1-mesas')

  // Paso 1: la mesa.
  await page.getByRole('link', { name: /Mesa 2.*Libre/u }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mesa 2' })).toBeVisible()
  const bar = page.getByRole('button', { name: /Toca un plato|Ver y anotar/u })
  await expect(bar).toContainText('Toca un plato')

  // Paso 2: los platos (dos toques; el más y el menos ajustan la cantidad).
  await page.getByRole('button', { name: /^Lomo saltado/u }).click()
  await page.getByRole('button', { name: /^Chicha morada/u }).click()
  await page.getByRole('button', { name: 'Uno más de Chicha morada' }).click()
  await expect(bar).toContainText('3 platos · Ver y anotar')
  await expect(bar).toContainText(soles('48.00'))
  await page.getByRole('button', { name: 'Uno menos de Chicha morada' }).click()
  await expect(bar).toContainText('2 platos · Ver y anotar')
  await expect(bar).toContainText(soles('40.00'))
  await evidence(page, 'sal-01-2-platos')

  // Paso 3: enviar.
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(notice(page, /Pedido #1 enviado a cocina/u)).toBeVisible()
  await expect(page).toHaveURL(/\/pedidos$/u)
  const table = page.getByRole('link', { name: /Mesa 2/u })
  await expect(table).toContainText('En cocina')
  await expect(table).toContainText(soles('40.00'))
  await expect(page.getByRole('heading', { name: '3 de 4 mesas libres' })).toBeVisible()
  await evidence(page, 'sal-01-3-enviado')

  const active = await api(local, local.waiter).list('/orders/active')
  expect(active).toHaveLength(1)
  expect(active[0]).toMatchObject({ status: 'in_kitchen', table_id: local.table('2').id, total: '40.00' })
})

test('SAL-02 el mesero busca, filtra por categoría y anota en el resumen antes de enviar @mobile', async ({ page, local }) => {
  covers(
    'hoja:orders/taking/CartSheet',
    'funcion:pedido-nuevo.buscar-plato',
    'funcion:pedido-nuevo.filtrar-categoria',
    'funcion:pedido-nuevo.resumen-y-notas',
    'estado:pedido-nuevo.sin-resultados',
  )
  await openAs(page, local.waiter, `/pedidos/nuevo?mesa=${String(local.table('3').id)}`)
  const categories = page.getByRole('group', { name: 'Categorías' })
  await categories.getByRole('button', { name: 'Bebidas' }).click()
  await expect(categories.getByRole('button', { name: 'Bebidas' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /^Inca Kola/u })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Lomo saltado/u })).toBeHidden()
  await categories.getByRole('button', { name: 'Toda la carta' }).click()

  const search = page.getByRole('searchbox', { name: 'Buscar plato' })
  await search.fill('pizza')
  await expect(page.getByText('Ningún plato coincide con «pizza»')).toBeVisible()
  await search.fill('ceviche')
  await expect(page.getByRole('button', { name: /^Ají de gallina/u })).toBeHidden()
  await page.getByRole('button', { name: /^Ceviche clásico/u }).click()
  await search.fill('')
  await page.getByRole('button', { name: /^Inca Kola/u }).click()
  await evidence(page, 'sal-02-1-busqueda')

  await page.getByRole('button', { name: /Ver y anotar/u }).click()
  const sheet = page.getByRole('dialog', { name: 'Resumen · Mesa 3' })
  await expect(sheet).toBeVisible()
  await sheet.getByRole('textbox', { name: 'Nota para cocina' }).first().fill('Sin cebolla, poco ají')
  await sheet.getByRole('button', { name: 'Uno más de Inca Kola 500 ml' }).click()
  await expect(sheet).toContainText('3 platos')
  await expect(sheet).toContainText(soles('40.00'))
  await evidence(page, 'sal-02-2-resumen')
  await sheet.getByRole('button', { name: 'Seguir eligiendo' }).click()
  await expect(sheet).toBeHidden()
  await page.getByRole('button', { name: /Ver y anotar/u }).click()
  await expect(sheet.getByRole('textbox', { name: 'Nota para cocina' }).first()).toHaveValue('Sin cebolla, poco ají')
  await sheet.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(notice(page, /enviado a cocina/u)).toBeVisible()

  const [order] = await api(local, local.waiter).list('/orders/active')
  const lines = order.items as { name: string; quantity: number; notes: string }[]
  expect(lines).toEqual([
    expect.objectContaining({ name: 'Ceviche clásico', quantity: 1, notes: 'Sin cebolla, poco ají' }),
    expect.objectContaining({ name: 'Inca Kola 500 ml', quantity: 2, notes: '' }),
  ])
})

test('SAL-03 un plato agotado o sin insumos se ve pero no se puede elegir @mobile', async ({ page, local }) => {
  covers('funcion:pedido-nuevo.plato-agotado', 'funcion:pedido-nuevo.plato-sin-insumos')
  await api(local).patch(`/menu/items/${String(local.dish('Ají de gallina').id)}/availability`, { is_available: false })
  // Sin lomo de res en el almacén, la receta del Lomo saltado no alcanza.
  const [lomoRes] = local.ingredients
  await api(local).post('/inventory/waste', { ingredient_id: lomoRes.id, quantity: '5000', reason: 'Se malogró' })
  await openAs(page, local.waiter, `/pedidos/nuevo?mesa=${String(local.table('1').id)}`)

  const aji = page.getByRole('button', { name: /^Ají de gallina/u })
  await expect(aji).toBeDisabled()
  await expect(aji).toContainText('Agotado')
  const lomo = page.getByRole('button', { name: /^Lomo saltado/u })
  await expect(lomo).toBeDisabled()
  await expect(lomo).toContainText('Sin insumos')
  await expect(page.getByRole('button', { name: /^Ceviche clásico/u })).toBeEnabled()
  await evidence(page, 'sal-03-1-agotados')

  // En vivo: el encargado lo repone y el celular lo vuelve a ofrecer sin recargar.
  await api(local).patch(`/menu/items/${String(local.dish('Ají de gallina').id)}/availability`, { is_available: true })
  await expect(aji).toBeEnabled()
  await expect(aji).not.toContainText('Agotado')
})

test('SAL-04 un plato con opciones pide el término y suma los extras al precio @mobile', async ({ page, local }) => {
  covers('dialogo:orders/taking/ModifierDialog', 'funcion:pedido-nuevo.opciones-del-plato')
  const bistec = await dishWithOptions(local)
  await openAs(page, local.waiter, `/pedidos/nuevo?mesa=${String(local.table('4').id)}`)

  await page.getByRole('button', { name: /^Bistec a lo pobre/u }).click()
  const windowValue = page.getByRole('dialog', { name: 'Bistec a lo pobre' })
  await expect(windowValue).toContainText('Precio base')
  const add = windowValue.getByRole('button', { name: /Elige término|Agregar ·/u })
  await expect(add).toBeDisabled()
  await expect(add).toHaveText('Elige término')
  await windowValue.getByRole('button', { name: 'Jugoso' }).click()
  await windowValue.getByRole('button', { name: 'A punto' }).click()
  await expect(windowValue.getByRole('button', { name: 'Jugoso' })).toHaveAttribute('aria-pressed', 'false')
  await windowValue.getByRole('button', { name: /Huevo frito/u }).click()
  await windowValue.getByRole('button', { name: /Plátano/u }).click()
  await expect(add).toHaveText(/Agregar · S\/\s*35\.50/u)
  await evidence(page, 'sal-04-1-opciones')
  await add.click()
  await expect(windowValue).toBeHidden()

  // Cerrar sin confirmar no suma nada.
  await page.getByRole('button', { name: /^Bistec a lo pobre/u }).click()
  await page.keyboard.press('Escape')
  await expect(windowValue).toBeHidden()
  await expect(page.getByRole('button', { name: /Ver y anotar/u })).toContainText('1 plato')

  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(notice(page, /enviado a cocina/u)).toBeVisible()
  const [order] = await api(local, local.waiter).list('/orders/active')
  expect(order.total).toBe('35.50')
  const [line] = order.items as { menu_item_id: number; modifiers: { option: string; price: string }[] }[]
  expect(line.menu_item_id).toBe(bistec.id)
  expect(line.modifiers.map((m) => m.option)).toEqual(['A punto', 'Huevo frito', 'Plátano'])
})

test('SAL-38 la comanda y la precuenta muestran las opciones elegidas del plato @mobile', async ({ page, local }) => {
  covers('funcion:pedido.opciones-impresas')
  const bistec = await dishWithOptions(local)
  const order = await orderInTable(local, local.table('4'), [
    { dish: bistec, options: [{ group: 'Término', option: 'A punto' }, { group: 'Extras', option: 'Huevo frito' }] },
  ])
  await countPrints(page)
  await openAs(page, local.waiter, `/imprimir/${String(id(order))}/comanda`)
  const sheet = page.locator('#hoja-impresa')
  await expect(sheet).toContainText('1 × Bistec a lo pobre')
  await expect(sheet).toContainText('A punto · Huevo frito')
  await expect.poll(() => prints(page)).toBe(1)
  await evidence(page, 'sal-38-1-comanda')
  await page.goto(`/imprimir/${String(id(order))}/cuenta`)
  await expect(sheet).toContainText('1 × Bistec a lo pobre (A punto, Huevo frito)')
  await expect(sheet).toContainText(/Total\s*S\/\s*32\.50/u)
  expect((await readOrder(local, id(order))).status).toBe('in_kitchen')
})

test('SAL-05 una mesa que se ocupó mientras se elegía avisa, y una mesa que no existe también @mobile', async ({ page, local }) => {
  covers('funcion:pedido-nuevo.mesa-ocupada', 'estado:pedido-nuevo.mesa-inexistente')
  const order = await openOrder(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])
  await openAs(page, local.waiter, `/pedidos/nuevo?mesa=${String(local.table('1').id)}`)
  await expect(page.getByText(`Esta mesa ya tiene el pedido #${String(order.number)}.`)).toBeVisible()
  await evidence(page, 'sal-05-1-ocupada')
  await page.getByRole('link', { name: 'Ver el pedido' }).click()
  // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
  await expect(page).toHaveURL(new RegExp(`/pedidos/${String(order.id)}$`, 'u'))

  await page.goto('/pedidos/nuevo?mesa=999999')
  await expect(page.getByText('Esa mesa no existe o está desactivada')).toBeVisible()
  await page.getByRole('link', { name: 'Volver a las mesas' }).click()
  await expect(page).toHaveURL(/\/pedidos$/u)
})
