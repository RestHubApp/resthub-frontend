// HU08: las mesas del salón. Crear, renombrar, ordenar como el recorrido del
// salón y desactivar las que no se usan; una mesa ocupada no se desactiva.
import type { TableState } from '../../src/api/types'
import { orderInTable } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api } from '../support/management'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-14 el encargado crea, renombra, ordena, desactiva y activa mesas, y una mesa ocupada no se desactiva', async ({ page, local }) => {
  covers(
    'ruta:/mesas',
    'dialogo:tables/TableFormDialog',
    'funcion:mesas.crear',
    'funcion:mesas.renombrar',
    'funcion:mesas.ordenar',
    'funcion:mesas.desactivar',
    'funcion:mesas.activar',
    'funcion:mesas.ocupada-no-se-desactiva',
  )
  await orderInTable(local, local.table('1'), [{ dish: local.dish('Chicha morada') }])
  await openAs(page, local.owner, '/mesas')
  await expect(page.getByRole('heading', { level: 1, name: 'Mesas' })).toBeVisible()
  await expect(page.getByText('4 activas de 4')).toBeVisible()
  const table = (name: string) => page.getByRole('main').getByRole('listitem').filter({ has: page.getByText(name, { exact: true }) })
  // Las acciones de una mesa están tras su menú «⋯».
  const action = async (name: string, item: string) => {
    await table(name).getByRole('button', { name: `Más acciones de ${name}` }).click()
    await page.getByRole('menu', { name: `Más acciones de ${name}` }).getByRole('menuitem', { name: item }).click()
  }
  const menuItem = async (name: string, item: string) => {
    await table(name).getByRole('button', { name: `Más acciones de ${name}` }).click()
    return page.getByRole('menu', { name: `Más acciones de ${name}` }).getByRole('menuitem', { name: item })
  }

  // Una mesa ocupada muestra su pedido y no se puede desactivar.
  await expect(table('Mesa 1')).toContainText(/Ocupada · pedido #1/u)
  await expect(await menuItem('Mesa 1', 'Desactivar')).toHaveAttribute('aria-disabled', 'true')
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Nueva mesa' }).click()
  const registration = page.getByRole('dialog', { name: 'Nueva mesa' })
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(registration.getByText('Escribe el nombre de la mesa')).toBeVisible()
  await registration.getByLabel('Nombre').fill('2')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(registration.getByRole('alert')).toBeVisible()
  await evidence(page, 'ges-14-1-mesa-repetida')
  await registration.getByLabel('Nombre').fill('Terraza 1')
  await registration.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Mesa creada.')).toBeVisible()
  await expect(page.getByText('5 activas de 5')).toBeVisible()

  await action('Terraza 1', 'Renombrar')
  const rename = page.getByRole('dialog', { name: 'Renombrar Terraza 1' })
  await expect(rename.getByLabel('Nombre')).toHaveValue('Terraza 1')
  await rename.getByLabel('Nombre').fill('Terraza 2')
  await rename.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Mesa renombrada.')).toBeVisible()
  await expect(table('Terraza 2')).toBeVisible()

  // La terraza va antes que la mesa 4 en el recorrido.
  await expect(await menuItem('Terraza 2', 'Bajar')).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('menu', { name: 'Más acciones de Terraza 2' }).getByRole('menuitem', { name: 'Subir' }).click()
  await expect.poll(async () => (await api(local).list<TableState>('/tables?include_inactive=true')).map((m) => m.label)).toEqual([
    '1',
    '2',
    '3',
    'Terraza 2',
    '4',
  ])
  await expect(await menuItem('Terraza 2', 'Bajar')).not.toHaveAttribute('aria-disabled', 'true')
  await page.keyboard.press('Escape')

  await action('Mesa 4', 'Desactivar')
  await expect(notice(page, 'Mesa 4 desactivada.')).toBeVisible()
  await expect(table('Mesa 4')).toContainText('Inactiva')
  await expect(page.getByText('4 activas de 5')).toBeVisible()
  await evidence(page, 'ges-14-2-mesas')
  // El mesero ya no la ve al elegir mesa.
  expect((await api(local, local.waiter).list<TableState>('/tables')).map((m) => m.label)).not.toContain('4')
  await action('Mesa 4', 'Activar')
  await expect(notice(page, 'Mesa 4 activada.')).toBeVisible()
  await expect(page.getByText('5 activas de 5')).toBeVisible()
})
