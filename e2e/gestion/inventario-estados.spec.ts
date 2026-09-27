// HU15, HU16: paginación de los insumos y del libro de movimientos, y lo que
// muestra cada pestaña del inventario cuando el servidor falla.
import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'
import { api, fallaServidor } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-10 los insumos y el libro de movimientos se paginan', async ({ page, local }) => {
  cubre('funcion:inventario.paginar', 'funcion:movimientos.paginar', 'funcion:inventario.cancelar-accion')
  const encargado = api(local)
  for (let n = 1; n <= 28; n += 1) {
    const insumo = await encargado.post('/inventory/ingredients', { name: `Insumo ${String(n).padStart(2, '0')}`, unit: 'unit', min_stock: '0', unit_cost: '1' })
    if (n <= 18) {
      await encargado.post('/inventory/purchases', { ingredient_id: insumo.id, quantity: '5', unit_cost: '1', reason: `Compra ${String(n)}` })
    }
  }
  await abrirComo(page, local.encargado, '/inventario')
  const insumos = page.getByRole('tabpanel', { name: /Insumos/u })
  await expect(insumos.getByText('31 insumos', { exact: true })).toBeVisible()
  const paginas = insumos.getByRole('navigation', { name: 'Paginación' })
  await expect(paginas).toContainText('Página 1 de 2')
  await expect(insumos.getByRole('row')).toHaveCount(31)
  await paginas.getByRole('button', { name: 'Siguiente' }).click()
  await expect(paginas).toContainText('Página 2 de 2')
  await expect(insumos.getByRole('row')).toHaveCount(2)
  await evidencia(page, 'ges-10-1-insumos-pagina-2')

  // Abrir una acción y cancelarla no registra nada.
  const ultimo = insumos.getByRole('row').nth(1)
  await ultimo.getByRole('button', { name: /^Compra de/u }).click()
  const dialogo = page.getByRole('dialog', { name: /Registrar compra:/u })
  await dialogo.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialogo).toBeHidden()

  await page.getByRole('tab', { name: /Movimientos/u }).click()
  const libro = page.getByRole('tabpanel', { name: /Movimientos/u })
  const paginasLibro = libro.getByRole('navigation', { name: 'Paginación' })
  await expect(paginasLibro).toContainText('Página 1 de 2')
  await expect(libro.getByRole('row')).toHaveCount(21)
  await paginasLibro.getByRole('button', { name: 'Siguiente' }).click()
  await expect(paginasLibro).toContainText('Página 2 de 2')
  await expect(libro.getByRole('row')).toHaveCount(2)
  await expect(libro.getByRole('row', { name: /Stock inicial/u })).toBeVisible()
  await evidencia(page, 'ges-10-2-libro-pagina-2')
  // Filtrar vuelve a la primera página.
  await libro.getByLabel('Tipo').selectOption({ label: 'Compra' })
  await expect(paginasLibro).toContainText('Página 1 de 2')
  expect((await encargado.get('/inventory/movements?limit=1')).total).toBe(21)
})

test('GES-11 cada pestaña del inventario avisa si el servidor falla', async ({ page, local }) => {
  cubre(
    'estado:inventario.error',
    'estado:movimientos.error',
    'estado:inventario.alertas-error',
    'estado:recetas.error',
    'estado:compras.error',
    'estado:proveedores.error',
  )
  for (const ruta of ['/inventory/ingredients', '/inventory/movements', '/inventory/alerts', '/inventory/recipes', '/inventory/purchase-orders', '/inventory/suppliers']) {
    await fallaServidor(page, ruta)
  }
  await abrirComo(page, local.encargado, '/inventario')
  await expect(page.getByText('No se pudieron cargar los insumos.')).toBeVisible()
  const mensajes = {
    movimientos: 'No se pudo cargar el libro de movimientos.',
    alertas: 'No se pudieron cargar las alertas.',
    recetas: 'No se pudieron cargar las recetas.',
    compras: 'No se pudieron cargar las órdenes.',
    proveedores: 'No se pudieron cargar los proveedores.',
  }
  for (const [pestana, mensaje] of Object.entries(mensajes)) {
    await page.getByRole('tab', { name: new RegExp(pestana, 'iu') }).click()
    await expect(page.getByRole('tabpanel').getByRole('alert')).toHaveText(mensaje)
  }
  await evidencia(page, 'ges-11-1-error-proveedores')
})
