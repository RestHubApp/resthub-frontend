// HU08: las mesas del salón. Crear, renombrar, ordenar como el recorrido del
// salón y desactivar las que no se usan; una mesa ocupada no se desactiva.
import { pedidoEnMesa } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-14 el encargado crea, renombra, ordena, desactiva y activa mesas, y una mesa ocupada no se desactiva', async ({ page, local }) => {
  cubre(
    'ruta:/mesas',
    'dialogo:tables/TableFormDialog',
    'funcion:mesas.crear',
    'funcion:mesas.renombrar',
    'funcion:mesas.ordenar',
    'funcion:mesas.desactivar',
    'funcion:mesas.activar',
    'funcion:mesas.ocupada-no-se-desactiva',
  )
  await pedidoEnMesa(local, local.mesa('1'), [{ plato: local.plato('Chicha morada') }])
  await abrirComo(page, local.encargado, '/mesas')
  await expect(page.getByRole('heading', { level: 1, name: 'Mesas' })).toBeVisible()
  await expect(page.getByText('4 activas de 4')).toBeVisible()
  const mesa = (nombre: string) => page.getByRole('main').getByRole('listitem').filter({ has: page.getByText(nombre, { exact: true }) })

  // Una mesa ocupada muestra su pedido y no se puede desactivar.
  await expect(mesa('Mesa 1')).toContainText(/Ocupada · pedido #1/u)
  await expect(mesa('Mesa 1').getByRole('button', { name: 'Desactivar' })).toBeDisabled()

  await page.getByRole('button', { name: 'Nueva mesa' }).click()
  const alta = page.getByRole('dialog', { name: 'Nueva mesa' })
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(alta.getByText('Escribe el nombre de la mesa')).toBeVisible()
  await alta.getByLabel('Nombre').fill('2')
  await alta.getByRole('button', { name: 'Guardar' }).click()
  // El diálogo muestra además el aviso general de que no se guardó; se busca el motivo del servidor.
  await expect(alta.getByRole('alert').filter({ hasNotText: 'No se pudo guardar. Los datos siguen aquí' })).toBeVisible()
  await evidencia(page, 'ges-14-1-mesa-repetida')
  await alta.getByLabel('Nombre').fill('Terraza 1')
  await alta.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Mesa creada.')).toBeVisible()
  await expect(page.getByText('5 activas de 5')).toBeVisible()

  await mesa('Terraza 1').getByRole('button', { name: 'Renombrar' }).click()
  const renombrar = page.getByRole('dialog', { name: 'Renombrar Terraza 1' })
  await expect(renombrar.getByLabel('Nombre')).toHaveValue('Terraza 1')
  await renombrar.getByLabel('Nombre').fill('Terraza 2')
  await renombrar.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Mesa renombrada.')).toBeVisible()
  await expect(mesa('Terraza 2')).toBeVisible()

  // La terraza va antes que la mesa 4 en el recorrido.
  await expect(page.getByRole('button', { name: 'Bajar Terraza 2' })).toBeDisabled()
  await page.getByRole('button', { name: 'Subir Terraza 2' }).click()
  await expect.poll(async () => (await api(local).lista('/tables?include_inactive=true')).map((m) => m.label)).toEqual([
    '1',
    '2',
    '3',
    'Terraza 2',
    '4',
  ])
  await expect(page.getByRole('button', { name: 'Bajar Terraza 2' })).toBeEnabled()

  await mesa('Mesa 4').getByRole('button', { name: 'Desactivar' }).click()
  await expect(aviso(page, 'Mesa 4 desactivada.')).toBeVisible()
  await expect(mesa('Mesa 4')).toContainText('Inactiva')
  await expect(page.getByText('4 activas de 5')).toBeVisible()
  await evidencia(page, 'ges-14-2-mesas')
  // El mesero ya no la ve al elegir mesa.
  expect((await api(local, local.mesero).lista('/tables')).map((m) => m.label)).not.toContain('4')
  await mesa('Mesa 4').getByRole('button', { name: 'Activar' }).click()
  await expect(aviso(page, 'Mesa 4 activada.')).toBeVisible()
  await expect(page.getByText('5 activas de 5')).toBeVisible()
})
