// HU21, HU24, HU23: la reposición sugerida y la auditoría de la IA. Sin clave
// de IA decide el motor por reglas, y cada decisión queda guardada con su
// entrada, su salida, su confianza y el motor que la tomó.
import type { AiDecisionPage } from '../../src/api/types'
import { defined } from '../support/defined'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import { api, failureServer } from '../support/management'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-29 el encargado revisa la reposición sugerida, filtra por acción, ve lo que puede esperar y actualiza con el motor por reglas', async ({ page, local }) => {
  covers(
    'ruta:/panel/reposicion',
    'funcion:reposicion.recomendaciones',
    'funcion:reposicion.actualizar',
    'funcion:reposicion.filtrar-accion',
    'funcion:reposicion.ver-en-espera',
    'estado:reposicion.error',
  )
  const preview = await api(local).get('/insights/restock')
  expect(preview).toMatchObject({ refreshed_at: null, counts: { buy_this_week: 1, wait: 2 } })
  await openAs(page, local.owner, '/panel')
  await page.getByRole('navigation', { name: 'Secciones del panel' }).getByRole('link', { name: 'Reposición' }).click()
  await expect(page).toHaveURL(/\/panel\/reposicion$/u)
  await expect(page.getByText('Es una vista previa calculada con las reglas fijas.')).toBeVisible()
  const list = page.getByRole('list', { name: 'Recomendaciones por insumo' })
  const culantro = list.getByRole('listitem').filter({ hasText: 'Culantro' })
  await expect(culantro).toContainText('Comprar esta semana')
  await expect(culantro).toContainText('Reglas')
  await expect(culantro).toContainText('Regla fija')
  await expect(culantro).toContainText(/Quedan 100 g de Culantro, por debajo del mínimo de 200 g/u)
  await expect(list.getByRole('listitem')).toHaveCount(1)
  await evidence(page, 'ges-29-1-reposicion')

  await page.getByRole('button', { name: 'Ver también los 2 insumos que pueden esperar' }).click()
  await expect(list.getByRole('listitem')).toHaveCount(3)
  await expect(list.getByRole('listitem').filter({ hasText: 'Lomo de res' })).toContainText('Esperar')

  // Cada tarjeta del resumen filtra; tocarla de nuevo muestra la lista completa.
  const summary = page.getByRole('region', { name: 'Resumen por acción' })
  const wait = summary.getByRole('button', { name: /Esperar/u })
  await wait.click()
  await expect(wait).toHaveAttribute('aria-pressed', 'true')
  await expect(wait).toContainText('Mostrando solo estos')
  await expect(list.getByRole('listitem')).toHaveCount(2)
  await summary.getByRole('button', { name: /Revisar merma/u }).click()
  await expect(page.getByText('No hay insumos con esa acción.')).toBeVisible()
  await summary.getByRole('button', { name: /Revisar merma/u }).click()
  await expect(list.getByRole('listitem')).toHaveCount(3)

  // Actualizar decide y guarda; sin clave de IA, el respaldo son las reglas.
  await page.getByRole('button', { name: 'Actualizar recomendaciones' }).click()
  await expect(page.getByText(/Última actualización:/u)).toBeVisible()
  await expect(page.getByText('Es una vista previa calculada con las reglas fijas.')).toBeHidden()
  await expect(culantro).toContainText('Respaldo: sin configurar')
  await evidence(page, 'ges-29-2-actualizada')
  const decisions = await api(local).get<AiDecisionPage>('/insights/ai-decisions?kind=restock')
  expect(decisions.total).toBe(3)

  await failureServer(page, '/insights/restock')
  await page.reload()
  await expect(page.getByText('No se pudo cargar la reposición.')).toBeVisible()
})

test('GES-30 el encargado audita las decisiones de la IA: filtra por tipo y motor, ve el JSON y pagina', async ({ page, local }) => {
  covers(
    'ruta:/panel/ia',
    'desplegable:insights/AiDecisionTable',
    'funcion:ia.decisiones',
    'funcion:ia.filtrar-tipo',
    'funcion:ia.filtrar-motor',
    'funcion:ia.ver-json',
    'funcion:ia.paginar',
    'estado:ia.vacio',
    'estado:ia.error',
  )
  const owner = api(local)
  for (let n = 1; n <= 18; n += 1) {
    await owner.post('/inventory/ingredients', { name: `Insumo ${String(n).padStart(2, '0')}`, unit: 'unit', min_stock: '0', unit_cost: '1' })
  }
  await owner.post('/insights/restock/refresh')
  await owner.post('/inventory/waste', { ingredient_id: defined(local.ingredients[1]).id, quantity: '100', reason: 'Se venció' })
  await owner.post('/insights/waste/classify')

  await openAs(page, local.owner, '/panel/ia')
  await expect(page.getByRole('link', { name: 'Auditoría de IA' })).toHaveAttribute('aria-current', 'page')
  await expect(page.getByText('22 en total con estos filtros.')).toBeVisible()
  const pages = page.getByRole('navigation', { name: 'Paginación' })
  await expect(pages).toContainText('Página 1 de 2')
  await expect(page.getByRole('row')).toHaveCount(21)
  await pages.getByRole('button', { name: 'Siguiente' }).click()
  await expect(pages).toContainText('Página 2 de 2')
  await expect(page.getByRole('row')).toHaveCount(3)
  await evidence(page, 'ges-30-1-auditoria')

  await page.getByLabel('Tipo').selectOption({ label: 'Causa de merma' })
  await expect(page.getByText('1 en total con estos filtros.')).toBeVisible()
  await expect(pages).toBeHidden()
  const row = page.getByRole('row', { name: /Merma: Cebolla roja/u })
  await expect(row).toContainText('Vencimiento')
  await expect(row).toContainText('Reglas')
  await expect(row).toContainText('Respaldo: sin configurar')
  await expect(row).toContainText('Regla fija')

  const detail = row.getByRole('button', { name: 'Ver JSON' })
  await detail.click()
  const open = row.getByRole('button', { name: 'Ocultar' })
  await expect(open).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByRole('heading', { name: 'Estado de entrada' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Salida' }).locator('xpath=..')).toContainText('"cause": "expiration"')
  await evidence(page, 'ges-30-2-json')
  await open.click()
  await expect(page.getByRole('heading', { name: 'Estado de entrada' })).toBeHidden()

  await page.getByLabel('Motor').selectOption({ label: 'Jev (IA)' })
  await expect(page.getByText('0 en total con estos filtros.')).toBeVisible()
  await expect(page.getByText('No hay decisiones con esos filtros.')).toBeVisible()
  await page.getByLabel('Tipo').selectOption({ label: 'Todos los tipos' })
  await page.getByLabel('Motor').selectOption({ label: 'Reglas fijas' })
  await expect(page.getByText('22 en total con estos filtros.')).toBeVisible()

  await failureServer(page, '/insights/ai-decisions')
  await page.reload()
  await expect(page.getByText('No se pudo cargar la auditoría.')).toBeVisible()
})
