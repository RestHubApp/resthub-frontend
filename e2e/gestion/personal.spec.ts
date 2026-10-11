// HU03, HU04: las cuentas del personal. Alta con rol y contraseña inicial,
// edición, contraseña restablecida, desactivar (ya no entra) y activar; la
// cuenta propia no cambia su rol ni se desactiva.
import { NEW_SECRET } from '../soporte/api'
import { covers } from '../soporte/cobertura'
import { openAs, notice, evidence, expect, test } from '../soporte/fixtures'
import { api, failureServer, tryAccess, newAccount } from '../soporte/gestion'

const OTHER_SECRET = 'otra-clave-e2e-2026'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-15 el encargado da de alta una cuenta, la edita, le restablece la contraseña, la desactiva y la vuelve a activar', async ({ page, local }) => {
  covers(
    'ruta:/personal',
    'dialogo:staff/StaffView',
    'dialogo:staff/StaffRowActions#1',
    'dialogo:staff/StaffRowActions#2',
    'confirmacion:staff/StaffStatusButton',
    'funcion:personal.crear',
    'funcion:personal.correo-repetido',
    'funcion:personal.editar',
    'funcion:personal.restablecer-contrasena',
    'funcion:personal.desactivar',
    'funcion:personal.activar',
    'funcion:personal.cuenta-propia',
  )
  const email = `lucia-${String(Date.now())}-${String(test.info().parallelIndex)}@e2e.resthub.dev`
  await openAs(page, local.encargado, '/personal')
  await expect(page.getByRole('heading', { level: 1, name: 'Personal' })).toBeVisible()
  await expect(page.getByRole('row', { name: /Encargada Prueba \(tú\)/u })).toBeVisible()

  await page.getByRole('button', { name: 'Nueva cuenta' }).click()
  const registration = page.getByRole('dialog', { name: 'Nueva cuenta' })
  await expect(registration.getByLabel('Rol')).toHaveValue(/\d+/u)
  await expect(registration.getByLabel('Rol').locator('option:checked')).toHaveText('Mesero')
  await registration.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(registration.getByText('Escribe el nombre completo')).toBeVisible()
  await expect(registration.getByText(/Escribe un correo válido/u)).toBeVisible()
  await registration.getByLabel('Nombre completo').fill('Lucía Ramos')
  await registration.getByLabel('Correo').fill(local.mesero.email)
  await registration.getByLabel('Contraseña inicial').fill(NEW_SECRET)
  await registration.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(registration.getByRole('alert')).toBeVisible()
  await evidence(page, 'ges-15-1-correo-repetido')
  await registration.getByLabel('Correo').fill(email)
  await registration.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(registration).toBeHidden()
  const row = page.getByRole('row', { name: /Lucía Ramos/u })
  await expect(row).toContainText('Mesero')
  await expect(row).toContainText('Activa')
  expect(await tryAccess(local.http, email, NEW_SECRET)).toBe(200)

  // Pasa a la cocina.
  await row.getByRole('button', { name: 'Editar' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar a Lucía Ramos' })
  await expect(edit.getByText(email)).toBeVisible()
  await edit.getByLabel('Rol').selectOption({ label: 'Cocinero' })
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(edit).toBeHidden()
  await expect(row).toContainText('Cocinero')

  await row.getByRole('button', { name: 'Contraseña' }).click()
  const password = page.getByRole('dialog', { name: 'Restablecer la contraseña de Lucía Ramos' })
  await password.getByLabel('Nueva contraseña').fill('corta')
  await password.getByRole('button', { name: 'Restablecer' }).click()
  await expect(password.getByLabel('Nueva contraseña')).toHaveAttribute('aria-invalid', 'true')
  await password.getByLabel('Nueva contraseña').fill(OTHER_SECRET)
  await password.getByRole('button', { name: 'Restablecer' }).click()
  await expect(notice(page, 'Contraseña de Lucía Ramos restablecida.')).toBeVisible()
  expect(await tryAccess(local.http, email, NEW_SECRET)).toBe(401)
  expect(await tryAccess(local.http, email, OTHER_SECRET)).toBe(200)

  // Desactivar se confirma: desde ese momento no entra.
  await row.getByRole('button', { name: 'Desactivar' }).click()
  const confirm = page.getByRole('alertdialog', { name: '¿Desactivar a Lucía Ramos?' })
  await evidence(page, 'ges-15-2-desactivar')
  await confirm.getByRole('button', { name: 'Desactivar' }).click()
  await expect(row).toContainText('Inactiva')
  expect(await tryAccess(local.http, email, OTHER_SECRET)).not.toBe(200)
  await row.getByRole('button', { name: 'Activar' }).click()
  await expect(row).toContainText('Activa')
  await expect.poll(() => tryAccess(local.http, email, OTHER_SECRET)).toBe(200)

  // La cuenta propia: el rol no se cambia y no se desactiva ni restablece acá.
  const own = page.getByRole('row', { name: /Encargada Prueba \(tú\)/u })
  await expect(own.getByRole('button', { name: 'Desactivar' })).toBeDisabled()
  await expect(own.getByRole('button', { name: 'Contraseña' })).toHaveCount(0)
  await own.getByRole('button', { name: 'Editar' }).click()
  const mia = page.getByRole('dialog', { name: 'Editar a Encargada Prueba' })
  await expect(mia.getByText('No puedes cambiar el rol de tu propia cuenta.')).toBeVisible()
  await expect(mia.getByLabel('Rol')).toHaveCount(0)
  await mia.getByRole('button', { name: 'Cancelar' }).click()
  await expect(mia).toBeHidden()
})

test('GES-16 la tabla del personal se pagina y avisa si el servidor falla', async ({ page, local }) => {
  covers('funcion:personal.paginar', 'estado:personal.error')
  const roles = await api(local).lista('/roles')
  const waiter = Number(roles.find((role) => role.kind === 'waiter')?.id)
  for (let n = 1; n <= 13; n += 1) {
    await newAccount(local, `Ayudante ${String.fromCodePoint(64 + n)}`, waiter)
  }
  await openAs(page, local.encargado, '/personal')
  const pages = page.getByRole('navigation', { name: 'Paginación' })
  await expect(pages).toContainText('Página 1 de 2')
  await expect(page.getByRole('row')).toHaveCount(16)
  await pages.getByRole('button', { name: 'Siguiente' }).click()
  await expect(pages).toContainText('Página 2 de 2')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(page.getByRole('row', { name: /Mesero Prueba/u })).toBeVisible()
  await evidence(page, 'ges-16-1-personal-pagina-2')

  await failureServer(page, '/staff')
  await page.reload()
  await expect(page.getByText('No se pudo cargar el personal.')).toBeVisible()
})
