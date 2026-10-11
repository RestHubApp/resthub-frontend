// HU15, HU16, HU19, HU34: los insumos y su stock. Compra, merma y ajuste
// desde la tabla, el libro de movimientos (kardex) con sus filtros y la
// alerta de stock bajo que desaparece sola al reponer.
import { covers } from '../soporte/cobertura'
import { openAs, notice, evidence, expect, test } from '../soporte/fixtures'
import { api } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-04 el encargado registra una merma, dos ajustes y una compra, revisa el kardex y la alerta de stock bajo desaparece al reponer', async ({ page, local }) => {
  covers(
    'ruta:/inventario',
    'pestanas:inventory/InventoryTabs',
    'dialogo:inventory/StockActionDialog',
    'funcion:inventario.merma',
    'funcion:inventario.ajuste-conteo',
    'funcion:inventario.ajuste-diferencia',
    'funcion:inventario.compra',
    'funcion:inventario.compra-desde-alerta',
    'funcion:inventario.ver-alertas',
    'funcion:inventario.alerta-desaparece-al-reponer',
    'funcion:movimientos.kardex',
    'funcion:movimientos.filtrar-insumo',
    'funcion:movimientos.filtrar-tipo',
    'estado:movimientos.sin-resultados',
    'estado:inventario.alertas-vacio',
  )
  await openAs(page, local.encargado, '/inventario')
  await expect(page.getByRole('heading', { level: 1, name: 'Inventario' })).toBeVisible()
  const summary = page.getByRole('status').filter({ hasText: 'por reponer' })
  await expect(summary).toContainText('1 insumo por reponer')
  await expect(summary).toContainText('Culantro')
  await expect(page.getByRole('tab', { name: /Alertas/u })).toContainText('1')
  await evidence(page, 'ges-04-1-inventario')

  // Merma: se pide el motivo y se ve cómo queda el stock antes de guardar.
  const ingredients = page.getByRole('tabpanel', { name: /Insumos/u })
  await ingredients.getByRole('button', { name: 'Merma de Cebolla roja' }).click()
  const waste = page.getByRole('dialog', { name: 'Registrar merma: Cebolla roja' })
  await waste.getByLabel('Cantidad perdida', { exact: true }).fill('250')
  await expect(waste.getByText(/Hoy hay 3 kg → quedará en 2\.75 kg/u)).toBeVisible()
  await waste.getByRole('button', { name: 'Registrar merma' }).click()
  await expect(waste.getByText('Escribe el motivo de la merma')).toBeVisible()
  await waste.getByLabel('Motivo').fill('Se malogró en la cámara')
  await evidence(page, 'ges-04-2-merma')
  await waste.getByRole('button', { name: 'Registrar merma' }).click()
  await expect(notice(page, 'Merma registrada: Cebolla roja queda en 2.75 kg')).toBeVisible()
  await expect(waste).toBeHidden()
  await expect(ingredients.getByRole('row', { name: /Cebolla roja/u })).toContainText('2.75 kg')

  // Ajuste por conteo: se escribe lo que hay y el sistema calcula la diferencia.
  await ingredients.getByRole('button', { name: 'Ajuste de Lomo de res' }).click()
  const adjustment = page.getByRole('dialog', { name: 'Ajustar stock: Lomo de res' })
  await expect(adjustment.getByLabel('Conté lo que hay')).toBeChecked()
  await adjustment.getByLabel('Stock contado', { exact: true }).fill('4.8')
  await expect(adjustment.getByText(/Hoy hay 5 kg → quedará en 4\.8 kg/u)).toBeVisible()
  await expect(adjustment.getByLabel('Motivo', { exact: true })).toHaveValue('Conteo físico')
  await adjustment.getByRole('button', { name: 'Guardar ajuste' }).click()
  await expect(notice(page, 'Ajuste de −200 g: Lomo de res queda en 4.8 kg')).toBeVisible()

  // Ajuste por diferencia: sobra algo que no se había anotado.
  await ingredients.getByRole('button', { name: 'Ajuste de Lomo de res' }).click()
  await adjustment.getByText('Sé cuánto sobra o falta').click()
  await adjustment.getByLabel('La diferencia', { exact: true }).selectOption({ label: 'Sobra: sumar al stock' })
  await adjustment.getByLabel('Cantidad de la diferencia', { exact: true }).fill('150')
  await adjustment.getByLabel('Unidad de cantidad de la diferencia').selectOption('g')
  await expect(adjustment.getByText(/quedará en 4\.95 kg/u)).toBeVisible()
  await adjustment.getByLabel('Motivo', { exact: true }).fill('Bolsa sin registrar')
  await evidence(page, 'ges-04-3-ajuste')
  await adjustment.getByRole('button', { name: 'Guardar ajuste' }).click()
  await expect(notice(page, 'Ajuste de +150 g: Lomo de res queda en 4.95 kg')).toBeVisible()

  // La alerta lleva a la compra; al reponer, desaparece sola.
  await page.getByRole('button', { name: 'Ver alertas' }).click()
  await expect(page).toHaveURL(/vista=alertas/u)
  const alerts = page.getByRole('tabpanel', { name: /Alertas/u })
  const card = alerts.getByRole('listitem').filter({ hasText: 'Culantro' })
  await expect(card).toContainText('Hay 100 g')
  await expect(card).toContainText('Mínimo 200 g')
  await expect(card).toContainText('Faltan 100 g')
  await expect(card).toContainText('Bajo mínimo')
  await evidence(page, 'ges-04-4-alerta')
  await card.getByRole('button', { name: 'Registrar compra de Culantro' }).click()
  const purchase = page.getByRole('dialog', { name: 'Registrar compra: Culantro' })
  await purchase.getByLabel('Cantidad comprada', { exact: true }).fill('0.5')
  await expect(purchase.getByLabel('Costo por kg (S/)')).toHaveValue('12')
  await expect(purchase.getByText(/Total S\/\s*6\.00 · sale a S\/\s*12\.00 por kg/u)).toBeVisible()
  await purchase.getByText('Total pagado', { exact: true }).click()
  await purchase.getByLabel('Total pagado (S/)').fill('7.50')
  await expect(purchase.getByText(/sale a S\/\s*15\.00 por kg/u)).toBeVisible()
  await expect(purchase.getByText(/Hoy hay 100 g → quedará en 600 g/u)).toBeVisible()
  await purchase.getByLabel('Nota (opcional)').fill('Mercado mayorista')
  await evidence(page, 'ges-04-5-compra')
  await purchase.getByRole('button', { name: 'Registrar compra' }).click()
  await expect(notice(page, 'Compra registrada: Culantro queda en 600 g')).toBeVisible()
  await expect(alerts.getByText('Nada por reponer')).toBeVisible()
  await expect(page.getByText('Stock en orden: nada por debajo del mínimo.')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Alertas/u })).toHaveText('Alertas')
  await evidence(page, 'ges-04-6-sin-alertas')

  // El kardex: cada movimiento, con quién y por qué, filtrable.
  await page.getByRole('tab', { name: /Movimientos/u }).click()
  const book = page.getByRole('tabpanel', { name: /Movimientos/u })
  await expect(book.getByRole('row')).toHaveCount(8)
  await book.getByLabel('Insumo').selectOption({ label: 'Culantro' })
  await expect(book.getByRole('row')).toHaveCount(3)
  await expect(book.getByRole('row', { name: /Mercado mayorista/u })).toContainText('+500 g')
  await expect(book.getByRole('row', { name: /Stock inicial/u })).toContainText('+100 g')
  await book.getByLabel('Tipo').selectOption({ label: 'Merma' })
  await expect(book.getByText('No hay movimientos con estos filtros.')).toBeVisible()
  await book.getByLabel('Insumo').selectOption({ label: 'Todos los insumos' })
  const row = book.getByRole('row', { name: /Se malogró en la cámara/u })
  await expect(row).toContainText('Cebolla roja')
  await expect(row).toContainText('−250 g')
  await expect(book.getByRole('row')).toHaveCount(2)
  await book.getByLabel('Tipo').selectOption({ label: 'Ajuste' })
  await expect(book.getByRole('row')).toHaveCount(3)
  await expect(book.getByRole('row', { name: /Bolsa sin registrar/u })).toContainText('+150 g')
  await evidence(page, 'ges-04-7-kardex')

  const stock = new Map((await api(local).lista('/inventory/ingredients')).map((i) => [i.name, i.stock]))
  expect(Object.fromEntries(stock)).toMatchObject({ 'Lomo de res': '4950.000', 'Cebolla roja': '2750.000', Culantro: '600.000' })
})

test('GES-05 el encargado da de alta y edita un insumo, busca y filtra los bajos, y decide si los platos sin insumos se agotan solos', async ({ page, local }) => {
  covers(
    'funcion:inventario.nuevo-insumo',
    'funcion:inventario.editar-insumo',
    'funcion:inventario.buscar',
    'funcion:inventario.solo-bajo-minimo',
    'funcion:inventario.agotar-sin-insumos',
    'estado:inventario.sin-resultados',
  )
  await openAs(page, local.encargado, '/inventario')
  await page.getByRole('button', { name: 'Nuevo insumo' }).click()
  const registration = page.getByRole('dialog', { name: 'Nuevo insumo' })
  await registration.getByRole('button', { name: 'Crear insumo' }).click()
  await expect(registration.getByText('Escribe el nombre del insumo')).toBeVisible()
  await registration.getByLabel('Nombre').fill('Limón')
  await registration.getByLabel('Cómo se mide').selectOption({ label: 'Peso (se cuenta en g y kg)' })
  await registration.getByLabel('Stock mínimo', { exact: true }).fill('2')
  await registration.getByLabel('Costo por kg (S/)').fill('4.20')
  await evidence(page, 'ges-05-1-nuevo-insumo')
  await registration.getByRole('button', { name: 'Crear insumo' }).click()
  await expect(notice(page, 'Insumo Limón creado.')).toBeVisible()
  const ingredients = page.getByRole('tabpanel', { name: /Insumos/u })
  const limon = ingredients.getByRole('row', { name: /Limón/u })
  await expect(limon).toContainText('Bajo mínimo')
  await expect(limon).toContainText('2 kg')
  await expect(limon).toContainText(/S\/\s*4\.20 por kg/u)
  await expect(page.getByText('2 insumos por reponer')).toBeVisible()

  // Editar: la unidad no se cambia; el mínimo sí.
  await ingredients.getByRole('button', { name: 'Editar Limón' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar: Limón' })
  await expect(edit.getByText(/Se mide en/u)).toContainText('La unidad no se cambia')
  await expect(edit.getByLabel('Stock mínimo', { exact: true })).toHaveValue('2')
  await edit.getByLabel('Stock mínimo', { exact: true }).fill('0')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Cambios guardados.')).toBeVisible()
  await expect(limon).toContainText('Suficiente')
  await expect(page.getByText('1 insumo por reponer')).toBeVisible()

  // Buscar y quedarse con lo que hay que reponer.
  const search = ingredients.getByLabel('Buscar insumo')
  await search.fill('CEBO')
  await expect(ingredients.getByText('1 de 4 insumos')).toBeVisible()
  await expect(ingredients.getByRole('row', { name: /Cebolla roja/u })).toBeVisible()
  await search.fill('pollo')
  await expect(ingredients.getByText('Ningún insumo coincide con la búsqueda.')).toBeVisible()
  await evidence(page, 'ges-05-2-sin-resultados')
  await search.fill('')
  await ingredients.getByLabel('Solo bajo mínimo').check()
  await expect(ingredients.getByText('1 de 4 insumos')).toBeVisible()
  await expect(ingredients.getByRole('row', { name: /Culantro/u })).toBeVisible()
  await expect(ingredients.getByRole('row', { name: /Limón/u })).toBeHidden()
  await ingredients.getByLabel('Solo bajo mínimo').uncheck()
  await expect(ingredients.getByText('4 insumos', { exact: true })).toBeVisible()

  // Sin lomo en stock, el Lomo saltado se agota solo; con la regla apagada, no.
  await api(local).post('/inventory/waste', { ingredient_id: local.insumos[0].id, quantity: '5000', reason: 'Se venció' })
  const lomoOutOfStock = async () => {
    const menu = (await api(local, local.mesero).get('/menu')).categories as { items: { name: string; out_of_stock: boolean }[] }[]
    return menu.flatMap((c) => c.items).find((p) => p.name === 'Lomo saltado')?.out_of_stock
  }
  expect(await lomoOutOfStock()).toBe(true)
  const rule = page.getByRole('checkbox', { name: /Agotar solos los platos sin insumos/u })
  await expect(rule).toBeChecked()
  await rule.click()
  await expect(notice(page, 'Los platos ya no se agotan por el stock.')).toBeVisible()
  await expect(rule).not.toBeChecked()
  await expect.poll(lomoOutOfStock).toBe(false)
  await evidence(page, 'ges-05-3-regla')
  await rule.click()
  await expect(notice(page, 'Los platos sin insumos se agotan solos.')).toBeVisible()
  await expect.poll(lomoOutOfStock).toBe(true)
})
