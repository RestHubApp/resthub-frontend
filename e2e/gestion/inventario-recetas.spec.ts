// HU17: la receta de cada plato, con su costo por porción y su margen en vivo.
// Se llega desde la pestaña Recetas del inventario o desde el plato en el menú.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, soles } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-06 el encargado arma la receta de un plato con su costo y su margen, y borra otra desde el menú', async ({ page, local }) => {
  cubre(
    'ruta:/inventario/recetas/:menuItemId',
    'funcion:recetas.costos-por-plato',
    'funcion:recetas.crear',
    'funcion:recetas.costo-en-vivo',
    'funcion:recetas.quitar-insumo',
    'funcion:recetas.borrar',
    'funcion:recetas.volver',
    'funcion:menu.margen-y-receta',
  )
  await abrirComo(page, local.encargado, '/inventario?vista=recetas')
  const panel = page.getByRole('tabpanel', { name: /Recetas/u })
  await expect(panel.getByText(/4 platos no tienen receta: al venderse no descuentan stock\./u)).toBeVisible()
  const lomo = panel.getByRole('row', { name: /Lomo saltado/u })
  await expect(lomo).toContainText(soles('8.64'))
  await expect(lomo).toContainText(soles('23.36'))
  await expect(lomo).toContainText('73.0 %')
  await expect(panel.getByRole('row', { name: /Ají de gallina/u })).toContainText('Sin receta')
  await evidencia(page, 'ges-06-1-recetas')

  await panel.getByRole('link', { name: 'Crear receta de Ají de gallina' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Receta: Ají de gallina' })).toBeVisible()
  const totales = page.getByRole('definition')
  await expect(totales.nth(0)).toHaveText(soles('24.00'))
  await expect(totales.nth(1)).toHaveText('—')
  await expect(page.getByText('Sin insumos. Agrega lo que lleva una porción')).toBeVisible()
  const guardar = page.getByRole('button', { name: 'Guardar receta' })
  await expect(guardar).toBeDisabled()

  const agregar = page.getByLabel('Agregar insumo')
  await agregar.selectOption({ label: 'Cebolla roja (g)' })
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Cebolla roja', exact: true })).toBeFocused()
  await guardar.click()
  await expect(page.getByText('Escribe la cantidad')).toBeVisible()
  await page.getByRole('textbox', { name: 'Cebolla roja', exact: true }).fill('100')
  await agregar.selectOption({ label: 'Culantro (g)' })
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  await page.getByRole('textbox', { name: 'Culantro', exact: true }).fill('10')
  await agregar.selectOption({ label: 'Lomo de res (g)' })
  await page.getByRole('button', { name: 'Agregar', exact: true }).click()
  await page.getByRole('textbox', { name: 'Lomo de res', exact: true }).fill('50')
  await expect(totales.nth(1)).toHaveText(soles('2.52'))
  await page.getByRole('button', { name: 'Quitar Lomo de res' }).click()
  await expect(page.getByRole('textbox', { name: 'Lomo de res', exact: true })).toBeHidden()
  await expect(totales.nth(1)).toHaveText(soles('0.42'))
  await expect(totales.nth(2)).toHaveText(soles('23.58'))
  await expect(totales.nth(3)).toHaveText('98.3 %')
  await expect(page.getByText('Hay cambios sin guardar.')).toBeVisible()
  await evidencia(page, 'ges-06-2-receta-en-vivo')
  await guardar.click()
  await expect(aviso(page, 'Receta de Ají de gallina guardada.')).toBeVisible()
  await expect(guardar).toBeDisabled()

  const receta = await api(local).get(`/inventory/recipes/${String(local.plato('Ají de gallina').id)}`)
  expect(receta).toMatchObject({ has_recipe: true, cost: '0.42' })
  expect(receta.lines).toHaveLength(2)

  await page.getByRole('link', { name: 'Volver a recetas' }).click()
  await expect(page).toHaveURL(/\/inventario\?vista=recetas$/u)
  await expect(panel.getByRole('row', { name: /Ají de gallina/u })).toContainText(soles('0.42'))
  await expect(panel.getByRole('link', { name: 'Editar receta de Ají de gallina' })).toBeVisible()

  // Desde el menú: el plato muestra su margen y lleva a su receta.
  await page.goto('/menu')
  await expect(page.getByText(/Costo S\/\s*8\.64 · Margen S\/\s*23\.36 \(73\.0 %\)/u)).toBeVisible()
  await page.getByRole('link', { name: 'Ver la receta de Lomo saltado' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Receta: Lomo saltado' })).toBeVisible()
  await page.getByRole('button', { name: 'Quitar Lomo de res' }).click()
  await page.getByRole('button', { name: 'Quitar Cebolla roja' }).click()
  await expect(page.getByText('Sin insumos: al guardar, el plato queda sin receta y sin costo.')).toBeVisible()
  await evidencia(page, 'ges-06-3-borrar-receta')
  await page.getByRole('button', { name: 'Borrar receta' }).click()
  await expect(aviso(page, 'Receta de Lomo saltado borrada.')).toBeVisible()
  await page.getByRole('link', { name: 'Volver al menú' }).click()
  await expect(page).toHaveURL(/\/menu$/u)
  await expect(page.getByRole('link', { name: 'Agregar la receta de Lomo saltado' })).toBeVisible()
})

test('GES-07 quien solo puede ver el inventario mira la receta sin editarla y un plato que no existe avisa', async ({ page, local }) => {
  cubre('funcion:recetas.solo-lectura', 'estado:receta.error')
  // El rol Cocinero ve el inventario pero no lo administra.
  await abrirComo(page, local.cocina, `/inventario/recetas/${String(local.plato('Lomo saltado').id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Receta: Lomo saltado' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Lomo de res', exact: true })).toHaveAttribute('readonly', '')
  await expect(page.getByRole('button', { name: 'Guardar receta' })).toBeHidden()
  await expect(page.getByLabel('Agregar insumo')).toBeHidden()
  await expect(page.getByRole('button', { name: /Quitar/u })).toHaveCount(0)
  await evidencia(page, 'ges-07-1-solo-lectura')

  await page.goto('/inventario/recetas/99999999')
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByText('Cargando la receta…')).toBeHidden()
  await evidencia(page, 'ges-07-2-no-existe')
})
