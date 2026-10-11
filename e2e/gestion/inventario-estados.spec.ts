// HU15, HU16: paginación de los insumos y del libro de movimientos, y lo que
// muestra cada pestaña del inventario cuando el servidor falla.
import { covers } from '../soporte/cobertura'
import { openAs, evidence, expect, test } from '../soporte/fixtures'
import { api, failureServer } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-10 los insumos y el libro de movimientos se paginan', async ({ page, local }) => {
  covers('funcion:inventario.paginar', 'funcion:movimientos.paginar', 'funcion:inventario.cancelar-accion')
  const owner = api(local)
  for (let n = 1; n <= 28; n += 1) {
    const ingredient = await owner.post('/inventory/ingredients', { name: `Insumo ${String(n).padStart(2, '0')}`, unit: 'unit', min_stock: '0', unit_cost: '1' })
    if (n <= 18) {
      await owner.post('/inventory/purchases', { ingredient_id: ingredient.id, quantity: '5', unit_cost: '1', reason: `Compra ${String(n)}` })
    }
  }
  await openAs(page, local.encargado, '/inventario')
  const ingredients = page.getByRole('tabpanel', { name: /Insumos/u })
  await expect(ingredients.getByText('31 insumos', { exact: true })).toBeVisible()
  const pages = ingredients.getByRole('navigation', { name: 'Paginación' })
  await expect(pages).toContainText('Página 1 de 2')
  await expect(ingredients.getByRole('row')).toHaveCount(31)
  await pages.getByRole('button', { name: 'Siguiente' }).click()
  await expect(pages).toContainText('Página 2 de 2')
  await expect(ingredients.getByRole('row')).toHaveCount(2)
  await evidence(page, 'ges-10-1-insumos-pagina-2')

  // Abrir una acción y cancelarla no registra nada.
  const last = ingredients.getByRole('row').nth(1)
  await last.getByRole('button', { name: /^Compra de/u }).click()
  const dialog = page.getByRole('dialog', { name: /Registrar compra:/u })
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole('tab', { name: /Movimientos/u }).click()
  const book = page.getByRole('tabpanel', { name: /Movimientos/u })
  const pagesBook = book.getByRole('navigation', { name: 'Paginación' })
  await expect(pagesBook).toContainText('Página 1 de 2')
  await expect(book.getByRole('row')).toHaveCount(21)
  await pagesBook.getByRole('button', { name: 'Siguiente' }).click()
  await expect(pagesBook).toContainText('Página 2 de 2')
  await expect(book.getByRole('row')).toHaveCount(2)
  await expect(book.getByRole('row', { name: /Stock inicial/u })).toBeVisible()
  await evidence(page, 'ges-10-2-libro-pagina-2')
  // Filtrar vuelve a la primera página.
  await book.getByLabel('Tipo').selectOption({ label: 'Compra' })
  await expect(pagesBook).toContainText('Página 1 de 2')
  expect((await owner.get('/inventory/movements?limit=1')).total).toBe(21)
})

test('GES-11 cada pestaña del inventario avisa si el servidor falla', async ({ page, local }) => {
  covers(
    'estado:inventario.error',
    'estado:movimientos.error',
    'estado:inventario.alertas-error',
    'estado:recetas.error',
    'estado:compras.error',
    'estado:proveedores.error',
  )
  for (const route of ['/inventory/ingredients', '/inventory/movements', '/inventory/alerts', '/inventory/recipes', '/inventory/purchase-orders', '/inventory/suppliers']) {
    await failureServer(page, route)
  }
  await openAs(page, local.encargado, '/inventario')
  await expect(page.getByText('No se pudieron cargar los insumos.')).toBeVisible()
  const messages = {
    movimientos: 'No se pudo cargar el libro de movimientos.',
    alertas: 'No se pudieron cargar las alertas.',
    recetas: 'No se pudieron cargar las recetas.',
    compras: 'No se pudieron cargar las órdenes.',
    proveedores: 'No se pudieron cargar los proveedores.',
  }
  for (const [tab, message] of Object.entries(messages)) {
    // eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
    await page.getByRole('tab', { name: new RegExp(tab, 'iu') }).click()
    await expect(page.getByRole('tabpanel').getByRole('alert')).toHaveText(message)
  }
  await evidence(page, 'ges-11-1-error-proveedores')
})
