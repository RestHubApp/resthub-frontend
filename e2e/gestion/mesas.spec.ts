// HU08: las mesas del salón. Crear, renombrar, ordenar como el recorrido del
// salón y desactivar las que no se usan; una mesa ocupada no se desactiva.
import { orderInTable } from '../soporte/api'
import { covers } from '../soporte/cobertura'
import { openAs, notice, evidence, expect, test } from '../soporte/fixtures'
import { api } from '../soporte/gestion'

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

  // Una mesa ocupada muestra su pedido y no se puede desactivar.
  await expect(table('Mesa 1')).toContainText(/Ocupada · pedido #1/u)
  await expect(table('Mesa 1').getByRole('button', { name: 'Desactivar' })).toBeDisabled()

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

  await table('Terraza 1').getByRole('button', { name: 'Renombrar' }).click()
  const rename = page.getByRole('dialog', { name: 'Renombrar Terraza 1' })
  await expect(rename.getByLabel('Nombre')).toHaveValue('Terraza 1')
  await rename.getByLabel('Nombre').fill('Terraza 2')
  await rename.getByRole('button', { name: 'Guardar' }).click()
  await expect(notice(page, 'Mesa renombrada.')).toBeVisible()
  await expect(table('Terraza 2')).toBeVisible()

  // La terraza va antes que la mesa 4 en el recorrido.
  await expect(page.getByRole('button', { name: 'Bajar Terraza 2' })).toBeDisabled()
  await page.getByRole('button', { name: 'Subir Terraza 2' }).click()
  await expect.poll(async () => (await api(local).list('/tables?include_inactive=true')).map((m) => m.label)).toEqual([
    '1',
    '2',
    '3',
    'Terraza 2',
    '4',
  ])
  await expect(page.getByRole('button', { name: 'Bajar Terraza 2' })).toBeEnabled()

  await table('Mesa 4').getByRole('button', { name: 'Desactivar' }).click()
  await expect(notice(page, 'Mesa 4 desactivada.')).toBeVisible()
  await expect(table('Mesa 4')).toContainText('Inactiva')
  await expect(page.getByText('4 activas de 5')).toBeVisible()
  await evidence(page, 'ges-14-2-mesas')
  // El mesero ya no la ve al elegir mesa.
  expect((await api(local, local.waiter).list('/tables')).map((m) => m.label)).not.toContain('4')
  await table('Mesa 4').getByRole('button', { name: 'Activar' }).click()
  await expect(notice(page, 'Mesa 4 activada.')).toBeVisible()
  await expect(page.getByText('5 activas de 5')).toBeVisible()
})
