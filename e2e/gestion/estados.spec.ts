// Lo que ve el encargado de un restaurante recién dado de alta, sin carta,
// mesas, inventario ni ventas, y lo que muestran el menú y las mesas si el
// servidor falla.
import { covers } from '../soporte/cobertura'
import { openAs, evidence, expect } from '../soporte/fixtures'
import { failureServer, test } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-32 un restaurante recién dado de alta muestra cada pantalla vacía con qué hacer', async ({ page, empty }) => {
  covers(
    'estado:menu.vacio',
    'estado:mesas.vacio',
    'estado:inventario.vacio',
    'estado:recetas.vacio',
    'estado:comprobantes.vacio',
    'estado:reposicion.vacio',
  )
  await openAs(page, empty.owner, '/menu')
  await expect(page.getByText('La carta está vacía')).toBeVisible()
  await expect(page.getByText('Empieza por una categoría, como Entradas o Bebidas')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Nuevo plato' })).toBeDisabled()
  await evidence(page, 'ges-32-1-menu-vacio')

  await page.goto('/mesas')
  await expect(page.getByText('Todavía no hay mesas')).toBeVisible()
  await expect(page.getByText('0 activas de 0')).toBeVisible()

  await page.goto('/inventario')
  await expect(page.getByText('Todavía no hay insumos.')).toBeVisible()
  await expect(page.getByText('Stock en orden: nada por debajo del mínimo.')).toBeVisible()
  await page.getByRole('tab', { name: /Recetas/u }).click()
  await expect(page.getByText('Todavía no hay platos en la carta.')).toBeVisible()

  await page.goto('/comprobantes')
  await expect(page.getByText('Todavía no se emitió ningún comprobante')).toBeVisible()

  await page.goto('/panel/reposicion')
  await expect(page.getByText('No hay insumos con esa acción.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Resumen por acción' }).getByRole('button')).toHaveCount(4)
  await evidence(page, 'ges-32-2-reposicion-vacia')
})

test('GES-33 el menú y las mesas avisan si el servidor falla', async ({ page, local }) => {
  covers('estado:menu.error', 'estado:mesas.error')
  await failureServer(page, '/menu')
  await failureServer(page, '/tables')
  await openAs(page, local.owner, '/menu')
  await expect(page.getByText('No se pudo cargar la carta.')).toBeVisible()
  await page.goto('/mesas')
  await expect(page.getByText('No se pudieron cargar las mesas.')).toBeVisible()
  await evidence(page, 'ges-33-1-mesas-error')
})
