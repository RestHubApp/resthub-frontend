// HU09, HU07, HU33: el mesero toma el pedido de una mesa desde el celular.
// Mesa, platos y «Enviar a cocina»; los platos agotados se ven pero no se
// eligen, y un plato con opciones pide el término antes de sumarse.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import {
  api,
  contarImpresiones,
  id,
  impresiones,
  leerPedido,
  pedidoAbierto,
  pedidoEnMesa,
  platoConOpciones,
} from '../soporte/salon'

const soles = (monto: string) => new RegExp(`S/\\s*${monto.replace('.', '\\.')}`, 'u')

test('SAL-01 el mesero toma el pedido de una mesa en tres pasos y lo envía a cocina @movil', async ({ page, local }) => {
  cubre(
    'ruta:/pedidos',
    'ruta:/pedidos/nuevo',
    'funcion:pedidos.ver-mesas',
    'funcion:pedido-nuevo.agregar-plato',
    'funcion:pedido-nuevo.cambiar-cantidad',
    'funcion:pedido-nuevo.enviar-a-cocina',
  )
  await abrirComo(page, local.mesero, '/pedidos')
  await expect(page.getByRole('heading', { name: '4 de 4 mesas libres' })).toBeVisible()
  await evidencia(page, 'sal-01-1-mesas')

  // Paso 1: la mesa.
  await page.getByRole('link', { name: /Mesa 2.*Libre/u }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Mesa 2' })).toBeVisible()
  const barra = page.getByRole('button', { name: /Toca un plato|Ver y anotar/u })
  await expect(barra).toContainText('Toca un plato')

  // Paso 2: los platos (dos toques; el más y el menos ajustan la cantidad).
  await page.getByRole('button', { name: /^Lomo saltado/u }).click()
  await page.getByRole('button', { name: /^Chicha morada/u }).click()
  await page.getByRole('button', { name: 'Uno más de Chicha morada' }).click()
  await expect(barra).toContainText('3 platos · Ver y anotar')
  await expect(barra).toContainText(soles('48.00'))
  await page.getByRole('button', { name: 'Uno menos de Chicha morada' }).click()
  await expect(barra).toContainText('2 platos · Ver y anotar')
  await expect(barra).toContainText(soles('40.00'))
  await evidencia(page, 'sal-01-2-platos')

  // Paso 3: enviar.
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(aviso(page, /Pedido #1 enviado a cocina/u)).toBeVisible()
  await expect(page).toHaveURL(/\/pedidos$/u)
  const mesa = page.getByRole('link', { name: /Mesa 2/u })
  await expect(mesa).toContainText('En cocina')
  await expect(mesa).toContainText(soles('40.00'))
  await expect(page.getByRole('heading', { name: '3 de 4 mesas libres' })).toBeVisible()
  await evidencia(page, 'sal-01-3-enviado')

  const activos = await api(local, local.mesero).lista('/orders/active')
  expect(activos).toHaveLength(1)
  expect(activos[0]).toMatchObject({ status: 'in_kitchen', table_id: local.mesa('2').id, total: '40.00' })
})

test('SAL-02 el mesero busca, filtra por categoría y anota en el resumen antes de enviar @movil', async ({ page, local }) => {
  cubre(
    'hoja:orders/taking/CartSheet',
    'funcion:pedido-nuevo.buscar-plato',
    'funcion:pedido-nuevo.filtrar-categoria',
    'funcion:pedido-nuevo.resumen-y-notas',
    'estado:pedido-nuevo.sin-resultados',
  )
  await abrirComo(page, local.mesero, `/pedidos/nuevo?mesa=${String(local.mesa('3').id)}`)
  const categorias = page.getByRole('group', { name: 'Categorías' })
  await categorias.getByRole('button', { name: 'Bebidas' }).click()
  await expect(categorias.getByRole('button', { name: 'Bebidas' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: /^Inca Kola/u })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Lomo saltado/u })).toBeHidden()
  await categorias.getByRole('button', { name: 'Toda la carta' }).click()

  const buscar = page.getByRole('searchbox', { name: 'Buscar plato' })
  await buscar.fill('pizza')
  await expect(page.getByText('Ningún plato coincide con «pizza»')).toBeVisible()
  await buscar.fill('ceviche')
  await expect(page.getByRole('button', { name: /^Ají de gallina/u })).toBeHidden()
  await page.getByRole('button', { name: /^Ceviche clásico/u }).click()
  await buscar.fill('')
  await page.getByRole('button', { name: /^Inca Kola/u }).click()
  await evidencia(page, 'sal-02-1-busqueda')

  await page.getByRole('button', { name: /Ver y anotar/u }).click()
  const hoja = page.getByRole('dialog', { name: 'Resumen · Mesa 3' })
  await expect(hoja).toBeVisible()
  await hoja.getByRole('textbox', { name: 'Nota para cocina' }).first().fill('Sin cebolla, poco ají')
  await hoja.getByRole('button', { name: 'Uno más de Inca Kola 500 ml' }).click()
  await expect(hoja).toContainText('3 platos')
  await expect(hoja).toContainText(soles('40.00'))
  await evidencia(page, 'sal-02-2-resumen')
  await hoja.getByRole('button', { name: 'Seguir eligiendo' }).click()
  await expect(hoja).toBeHidden()
  await page.getByRole('button', { name: /Ver y anotar/u }).click()
  await expect(hoja.getByRole('textbox', { name: 'Nota para cocina' }).first()).toHaveValue('Sin cebolla, poco ají')
  await hoja.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(aviso(page, /enviado a cocina/u)).toBeVisible()

  const [pedido] = await api(local, local.mesero).lista('/orders/active')
  const lineas = pedido.items as { name: string; quantity: number; notes: string }[]
  expect(lineas).toEqual([
    expect.objectContaining({ name: 'Ceviche clásico', quantity: 1, notes: 'Sin cebolla, poco ají' }),
    expect.objectContaining({ name: 'Inca Kola 500 ml', quantity: 2, notes: '' }),
  ])
})

test('SAL-03 un plato agotado o sin insumos se ve pero no se puede elegir @movil', async ({ page, local }) => {
  cubre('funcion:pedido-nuevo.plato-agotado', 'funcion:pedido-nuevo.plato-sin-insumos')
  await api(local).patch(`/menu/items/${String(local.plato('Ají de gallina').id)}/availability`, { is_available: false })
  // Sin lomo de res en el almacén, la receta del Lomo saltado no alcanza.
  const [lomoRes] = local.insumos
  await api(local).post('/inventory/waste', { ingredient_id: lomoRes.id, quantity: '5000', reason: 'Se malogró' })
  await abrirComo(page, local.mesero, `/pedidos/nuevo?mesa=${String(local.mesa('1').id)}`)

  const aji = page.getByRole('button', { name: /^Ají de gallina/u })
  await expect(aji).toBeDisabled()
  await expect(aji).toContainText('Agotado')
  const lomo = page.getByRole('button', { name: /^Lomo saltado/u })
  await expect(lomo).toBeDisabled()
  await expect(lomo).toContainText('Sin insumos')
  await expect(page.getByRole('button', { name: /^Ceviche clásico/u })).toBeEnabled()
  await evidencia(page, 'sal-03-1-agotados')

  // En vivo: el encargado lo repone y el celular lo vuelve a ofrecer sin recargar.
  await api(local).patch(`/menu/items/${String(local.plato('Ají de gallina').id)}/availability`, { is_available: true })
  await expect(aji).toBeEnabled()
  await expect(aji).not.toContainText('Agotado')
})

test('SAL-04 un plato con opciones pide el término y suma los extras al precio @movil', async ({ page, local }) => {
  cubre('dialogo:orders/taking/ModifierDialog', 'funcion:pedido-nuevo.opciones-del-plato')
  const bistec = await platoConOpciones(local)
  await abrirComo(page, local.mesero, `/pedidos/nuevo?mesa=${String(local.mesa('4').id)}`)

  await page.getByRole('button', { name: /^Bistec a lo pobre/u }).click()
  const ventana = page.getByRole('dialog', { name: 'Bistec a lo pobre' })
  await expect(ventana).toContainText('Precio base')
  const agregar = ventana.getByRole('button', { name: /Elige término|Agregar ·/u })
  await expect(agregar).toBeDisabled()
  await expect(agregar).toHaveText('Elige término')
  await ventana.getByRole('button', { name: 'Jugoso' }).click()
  await ventana.getByRole('button', { name: 'A punto' }).click()
  await expect(ventana.getByRole('button', { name: 'Jugoso' })).toHaveAttribute('aria-pressed', 'false')
  await ventana.getByRole('button', { name: /Huevo frito/u }).click()
  await ventana.getByRole('button', { name: /Plátano/u }).click()
  await expect(agregar).toHaveText(/Agregar · S\/\s*35\.50/u)
  await evidencia(page, 'sal-04-1-opciones')
  await agregar.click()
  await expect(ventana).toBeHidden()

  // Cerrar sin confirmar no suma nada.
  await page.getByRole('button', { name: /^Bistec a lo pobre/u }).click()
  await page.keyboard.press('Escape')
  await expect(ventana).toBeHidden()
  await expect(page.getByRole('button', { name: /Ver y anotar/u })).toContainText('1 plato')

  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(aviso(page, /enviado a cocina/u)).toBeVisible()
  const [pedido] = await api(local, local.mesero).lista('/orders/active')
  expect(pedido.total).toBe('35.50')
  const [linea] = pedido.items as { menu_item_id: number; modifiers: { option: string; price: string }[] }[]
  expect(linea.menu_item_id).toBe(bistec.id)
  expect(linea.modifiers.map((m) => m.option)).toEqual(['A punto', 'Huevo frito', 'Plátano'])
})

test('SAL-38 la comanda y la precuenta muestran las opciones elegidas del plato @movil', async ({ page, local }) => {
  cubre('funcion:pedido.opciones-impresas')
  const bistec = await platoConOpciones(local)
  const pedido = await pedidoEnMesa(local, local.mesa('4'), [
    { plato: bistec, opciones: [{ grupo: 'Término', opcion: 'A punto' }, { grupo: 'Extras', opcion: 'Huevo frito' }] },
  ])
  await contarImpresiones(page)
  await abrirComo(page, local.mesero, `/imprimir/${String(id(pedido))}/comanda`)
  const hoja = page.locator('#hoja-impresa')
  await expect(hoja).toContainText('1 × Bistec a lo pobre')
  await expect(hoja).toContainText('A punto · Huevo frito')
  await expect.poll(() => impresiones(page)).toBe(1)
  await evidencia(page, 'sal-38-1-comanda')
  await page.goto(`/imprimir/${String(id(pedido))}/cuenta`)
  await expect(hoja).toContainText('1 × Bistec a lo pobre (A punto, Huevo frito)')
  await expect(hoja).toContainText(/Total\s*S\/\s*32\.50/u)
  expect((await leerPedido(local, id(pedido))).status).toBe('in_kitchen')
})

test('SAL-05 una mesa que se ocupó mientras se elegía avisa, y una mesa que no existe también @movil', async ({ page, local }) => {
  cubre('funcion:pedido-nuevo.mesa-ocupada', 'estado:pedido-nuevo.mesa-inexistente')
  const pedido = await pedidoAbierto(local, local.mesa('1'), [{ plato: local.plato('Chicha morada') }])
  await abrirComo(page, local.mesero, `/pedidos/nuevo?mesa=${String(local.mesa('1').id)}`)
  await expect(page.getByText(`Esta mesa ya tiene el pedido #${String(pedido.number)}.`)).toBeVisible()
  await evidencia(page, 'sal-05-1-ocupada')
  await page.getByRole('link', { name: 'Ver el pedido' }).click()
  await expect(page).toHaveURL(new RegExp(`/pedidos/${String(pedido.id)}$`, 'u'))

  await page.goto('/pedidos/nuevo?mesa=999999')
  await expect(page.getByText('Esa mesa no existe o está desactivada')).toBeVisible()
  await page.getByRole('link', { name: 'Volver a las mesas' }).click()
  await expect(page).toHaveURL(/\/pedidos$/u)
})
