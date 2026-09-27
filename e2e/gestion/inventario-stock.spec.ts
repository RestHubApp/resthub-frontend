// HU15, HU16, HU19, HU34: los insumos y su stock. Compra, merma y ajuste
// desde la tabla, el libro de movimientos (kardex) con sus filtros y la
// alerta de stock bajo que desaparece sola al reponer.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-04 el encargado registra una merma, dos ajustes y una compra, revisa el kardex y la alerta de stock bajo desaparece al reponer', async ({ page, local }) => {
  cubre(
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
  await abrirComo(page, local.encargado, '/inventario')
  await expect(page.getByRole('heading', { level: 1, name: 'Inventario' })).toBeVisible()
  const resumen = page.getByRole('status').filter({ hasText: 'por reponer' })
  await expect(resumen).toContainText('1 insumo por reponer')
  await expect(resumen).toContainText('Culantro')
  await expect(page.getByRole('tab', { name: /Alertas/u })).toContainText('1')
  await evidencia(page, 'ges-04-1-inventario')

  // Merma: se pide el motivo y se ve cómo queda el stock antes de guardar.
  const insumos = page.getByRole('tabpanel', { name: /Insumos/u })
  await insumos.getByRole('button', { name: 'Merma de Cebolla roja' }).click()
  const merma = page.getByRole('dialog', { name: 'Registrar merma: Cebolla roja' })
  await merma.getByLabel('Cantidad perdida', { exact: true }).fill('250')
  await expect(merma.getByText(/Hoy hay 3 kg → quedará en 2\.75 kg/u)).toBeVisible()
  await merma.getByRole('button', { name: 'Registrar merma' }).click()
  await expect(merma.getByText('Escribe el motivo de la merma')).toBeVisible()
  await merma.getByLabel('Motivo').fill('Se malogró en la cámara')
  await evidencia(page, 'ges-04-2-merma')
  await merma.getByRole('button', { name: 'Registrar merma' }).click()
  await expect(aviso(page, 'Merma registrada: Cebolla roja queda en 2.75 kg')).toBeVisible()
  await expect(merma).toBeHidden()
  await expect(insumos.getByRole('row', { name: /Cebolla roja/u })).toContainText('2.75 kg')

  // Ajuste por conteo: se escribe lo que hay y el sistema calcula la diferencia.
  await insumos.getByRole('button', { name: 'Ajuste de Lomo de res' }).click()
  const ajuste = page.getByRole('dialog', { name: 'Ajustar stock: Lomo de res' })
  await expect(ajuste.getByLabel('Conté lo que hay')).toBeChecked()
  await ajuste.getByLabel('Stock contado', { exact: true }).fill('4.8')
  await expect(ajuste.getByText(/Hoy hay 5 kg → quedará en 4\.8 kg/u)).toBeVisible()
  await expect(ajuste.getByLabel('Motivo', { exact: true })).toHaveValue('Conteo físico')
  await ajuste.getByRole('button', { name: 'Guardar ajuste' }).click()
  await expect(aviso(page, 'Ajuste de −200 g: Lomo de res queda en 4.8 kg')).toBeVisible()

  // Ajuste por diferencia: sobra algo que no se había anotado.
  await insumos.getByRole('button', { name: 'Ajuste de Lomo de res' }).click()
  await ajuste.getByText('Sé cuánto sobra o falta').click()
  await ajuste.getByLabel('La diferencia', { exact: true }).selectOption({ label: 'Sobra: sumar al stock' })
  await ajuste.getByLabel('Cantidad de la diferencia', { exact: true }).fill('150')
  await ajuste.getByLabel('Unidad de cantidad de la diferencia').selectOption('g')
  await expect(ajuste.getByText(/quedará en 4\.95 kg/u)).toBeVisible()
  await ajuste.getByLabel('Motivo', { exact: true }).fill('Bolsa sin registrar')
  await evidencia(page, 'ges-04-3-ajuste')
  await ajuste.getByRole('button', { name: 'Guardar ajuste' }).click()
  await expect(aviso(page, 'Ajuste de +150 g: Lomo de res queda en 4.95 kg')).toBeVisible()

  // La alerta lleva a la compra; al reponer, desaparece sola.
  await page.getByRole('button', { name: 'Ver alertas' }).click()
  await expect(page).toHaveURL(/vista=alertas/u)
  const alertas = page.getByRole('tabpanel', { name: /Alertas/u })
  const tarjeta = alertas.getByRole('listitem').filter({ hasText: 'Culantro' })
  await expect(tarjeta).toContainText('Hay 100 g')
  await expect(tarjeta).toContainText('Mínimo 200 g')
  await expect(tarjeta).toContainText('Faltan 100 g')
  await expect(tarjeta).toContainText('Bajo mínimo')
  await evidencia(page, 'ges-04-4-alerta')
  await tarjeta.getByRole('button', { name: 'Registrar compra de Culantro' }).click()
  const compra = page.getByRole('dialog', { name: 'Registrar compra: Culantro' })
  await compra.getByLabel('Cantidad comprada', { exact: true }).fill('0.5')
  await expect(compra.getByLabel('Costo por kg (S/)')).toHaveValue('12')
  await expect(compra.getByText(/Total S\/\s*6\.00 · sale a S\/\s*12\.00 por kg/u)).toBeVisible()
  await compra.getByText('Total pagado', { exact: true }).click()
  await compra.getByLabel('Total pagado (S/)').fill('7.50')
  await expect(compra.getByText(/sale a S\/\s*15\.00 por kg/u)).toBeVisible()
  await expect(compra.getByText(/Hoy hay 100 g → quedará en 600 g/u)).toBeVisible()
  await compra.getByLabel('Nota (opcional)').fill('Mercado mayorista')
  await evidencia(page, 'ges-04-5-compra')
  await compra.getByRole('button', { name: 'Registrar compra' }).click()
  await expect(aviso(page, 'Compra registrada: Culantro queda en 600 g')).toBeVisible()
  await expect(alertas.getByText('Nada por reponer')).toBeVisible()
  await expect(page.getByText('Stock en orden: nada por debajo del mínimo.')).toBeVisible()
  await expect(page.getByRole('tab', { name: /Alertas/u })).toHaveText('Alertas')
  await evidencia(page, 'ges-04-6-sin-alertas')

  // El kardex: cada movimiento, con quién y por qué, filtrable.
  await page.getByRole('tab', { name: /Movimientos/u }).click()
  const libro = page.getByRole('tabpanel', { name: /Movimientos/u })
  await expect(libro.getByRole('row')).toHaveCount(8)
  await libro.getByLabel('Insumo').selectOption({ label: 'Culantro' })
  await expect(libro.getByRole('row')).toHaveCount(3)
  await expect(libro.getByRole('row', { name: /Mercado mayorista/u })).toContainText('+500 g')
  await expect(libro.getByRole('row', { name: /Stock inicial/u })).toContainText('+100 g')
  await libro.getByLabel('Tipo').selectOption({ label: 'Merma' })
  await expect(libro.getByText('No hay movimientos con estos filtros.')).toBeVisible()
  await libro.getByLabel('Insumo').selectOption({ label: 'Todos los insumos' })
  const fila = libro.getByRole('row', { name: /Se malogró en la cámara/u })
  await expect(fila).toContainText('Cebolla roja')
  await expect(fila).toContainText('−250 g')
  await expect(libro.getByRole('row')).toHaveCount(2)
  await libro.getByLabel('Tipo').selectOption({ label: 'Ajuste' })
  await expect(libro.getByRole('row')).toHaveCount(3)
  await expect(libro.getByRole('row', { name: /Bolsa sin registrar/u })).toContainText('+150 g')
  await evidencia(page, 'ges-04-7-kardex')

  const stock = new Map((await api(local).lista('/inventory/ingredients')).map((i) => [i.name, i.stock]))
  expect(Object.fromEntries(stock)).toMatchObject({ 'Lomo de res': '4950.000', 'Cebolla roja': '2750.000', Culantro: '600.000' })
})

test('GES-05 el encargado da de alta y edita un insumo, busca y filtra los bajos, y decide si los platos sin insumos se agotan solos', async ({ page, local }) => {
  cubre(
    'funcion:inventario.nuevo-insumo',
    'funcion:inventario.editar-insumo',
    'funcion:inventario.buscar',
    'funcion:inventario.solo-bajo-minimo',
    'funcion:inventario.agotar-sin-insumos',
    'estado:inventario.sin-resultados',
  )
  await abrirComo(page, local.encargado, '/inventario')
  await page.getByRole('button', { name: 'Nuevo insumo' }).click()
  const alta = page.getByRole('dialog', { name: 'Nuevo insumo' })
  await alta.getByRole('button', { name: 'Crear insumo' }).click()
  await expect(alta.getByText('Escribe el nombre del insumo')).toBeVisible()
  await alta.getByLabel('Nombre').fill('Limón')
  await alta.getByLabel('Cómo se mide').selectOption({ label: 'Peso (se cuenta en g y kg)' })
  await alta.getByLabel('Stock mínimo', { exact: true }).fill('2')
  await alta.getByLabel('Costo por kg (S/)').fill('4.20')
  await evidencia(page, 'ges-05-1-nuevo-insumo')
  await alta.getByRole('button', { name: 'Crear insumo' }).click()
  await expect(aviso(page, 'Insumo Limón creado.')).toBeVisible()
  const insumos = page.getByRole('tabpanel', { name: /Insumos/u })
  const limon = insumos.getByRole('row', { name: /Limón/u })
  await expect(limon).toContainText('Bajo mínimo')
  await expect(limon).toContainText('2 kg')
  await expect(limon).toContainText(/S\/\s*4\.20 por kg/u)
  await expect(page.getByText('2 insumos por reponer')).toBeVisible()

  // Editar: la unidad no se cambia; el mínimo sí.
  await insumos.getByRole('button', { name: 'Editar Limón' }).click()
  const edicion = page.getByRole('dialog', { name: 'Editar: Limón' })
  await expect(edicion.getByText(/Se mide en/u)).toContainText('La unidad no se cambia')
  await expect(edicion.getByLabel('Stock mínimo', { exact: true })).toHaveValue('2')
  await edicion.getByLabel('Stock mínimo', { exact: true }).fill('0')
  await edicion.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Cambios guardados.')).toBeVisible()
  await expect(limon).toContainText('Suficiente')
  await expect(page.getByText('1 insumo por reponer')).toBeVisible()

  // Buscar y quedarse con lo que hay que reponer.
  const buscar = insumos.getByLabel('Buscar insumo')
  await buscar.fill('CEBO')
  await expect(insumos.getByText('1 de 4 insumos')).toBeVisible()
  await expect(insumos.getByRole('row', { name: /Cebolla roja/u })).toBeVisible()
  await buscar.fill('pollo')
  await expect(insumos.getByText('Ningún insumo coincide con la búsqueda.')).toBeVisible()
  await evidencia(page, 'ges-05-2-sin-resultados')
  await buscar.fill('')
  await insumos.getByLabel('Solo bajo mínimo').check()
  await expect(insumos.getByText('1 de 4 insumos')).toBeVisible()
  await expect(insumos.getByRole('row', { name: /Culantro/u })).toBeVisible()
  await expect(insumos.getByRole('row', { name: /Limón/u })).toBeHidden()
  await insumos.getByLabel('Solo bajo mínimo').uncheck()
  await expect(insumos.getByText('4 insumos', { exact: true })).toBeVisible()

  // Sin lomo en stock, el Lomo saltado se agota solo; con la regla apagada, no.
  await api(local).post('/inventory/waste', { ingredient_id: local.insumos[0].id, quantity: '5000', reason: 'Se venció' })
  const lomoAgotado = async () => {
    const carta = (await api(local, local.mesero).get('/menu')).categories as { items: { name: string; out_of_stock: boolean }[] }[]
    return carta.flatMap((c) => c.items).find((p) => p.name === 'Lomo saltado')?.out_of_stock
  }
  expect(await lomoAgotado()).toBe(true)
  const regla = page.getByRole('checkbox', { name: /Agotar solos los platos sin insumos/u })
  await expect(regla).toBeChecked()
  await regla.click()
  await expect(aviso(page, 'Los platos ya no se agotan por el stock.')).toBeVisible()
  await expect(regla).not.toBeChecked()
  await expect.poll(lomoAgotado).toBe(false)
  await evidencia(page, 'ges-05-3-regla')
  await regla.click()
  await expect(aviso(page, 'Los platos sin insumos se agotan solos.')).toBeVisible()
  await expect.poll(lomoAgotado).toBe(true)
})
