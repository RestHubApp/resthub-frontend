// HU02: la cuenta propia. Los datos se leen; la contraseña se cambia pidiendo
// la actual. Se usa el mesero del restaurante de la prueba, nunca una cuenta
// de la semilla.
import { NEW_SECRET } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import { tryAccess } from '../support/management'

// Sin el nombre ni el correo del mesero: el backend rechaza esas palabras (422 `weak_password`).
const NEW = 'nueva-clave-e2e-2026'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-31 el mesero ve sus datos y cambia su contraseña pidiendo la actual @mobile', async ({ page, local }) => {
  covers(
    'ruta:/perfil',
    'dialogo:auth/ChangePasswordDialog',
    'funcion:perfil.ver-datos',
    'funcion:perfil.cambiar-contrasena',
    'funcion:perfil.validar-contrasena',
    'funcion:perfil.contrasena-actual-incorrecta',
  )
  await openAs(page, local.waiter, '/perfil')
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
  const data = (term: string) => page.getByRole('term').filter({ hasText: term }).locator('xpath=following-sibling::dd')
  await expect(data('Nombre')).toHaveText('Mesero Prueba')
  await expect(data('Correo')).toHaveText(local.waiter.email)
  await expect(data('Rol')).toHaveText('Mesero')
  await expect(data('Restaurante')).toHaveText('Restaurante E2E')

  // El formulario se abre en una ventana desde la tarjeta de datos.
  await expect(page.getByLabel('Contraseña actual', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Cambiar contraseña' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cambiar contraseña' })
  const actual = dialog.getByLabel('Contraseña actual', { exact: true })
  const fresh = dialog.getByLabel('Nueva contraseña', { exact: true })
  const repeated = dialog.getByLabel('Repite la nueva contraseña')
  const change = dialog.getByRole('button', { name: 'Cambiar contraseña' })
  await change.click()
  await expect(page.getByText('Escribe tu contraseña actual')).toBeVisible()
  await actual.fill(NEW_SECRET)
  await fresh.fill(NEW)
  await repeated.fill('otra-cosa-distinta')
  await change.click()
  await expect(page.getByText('Las dos contraseñas no coinciden')).toBeVisible()
  await fresh.fill(NEW_SECRET)
  await repeated.fill(NEW_SECRET)
  await change.click()
  await expect(page.getByText('La nueva contraseña tiene que ser distinta de la actual')).toBeVisible()
  await fresh.fill('corta')
  await repeated.fill('corta')
  await change.click()
  await expect(fresh).toHaveAttribute('aria-invalid', 'true')
  await evidence(page, 'ges-31-1-validaciones')

  // Con la actual equivocada no cambia nada.
  await actual.fill('no-es-la-clave-123')
  await fresh.fill(NEW)
  await repeated.fill(NEW)
  await change.click()
  await expect(page.getByRole('alert').filter({ hasText: /contraseña/iu })).toBeVisible()
  expect(await tryAccess(local.http, local.waiter.email, NEW_SECRET)).toBe(200)

  await dialog.getByRole('button', { name: 'Mostrar contraseña' }).first().click()
  await expect(actual).toHaveAttribute('type', 'text')
  await actual.fill(NEW_SECRET)
  await change.click()
  await expect(page.getByText('Contraseña actualizada.')).toBeVisible()
  await expect(actual).toHaveValue('')
  await evidence(page, 'ges-31-2-cambiada')
  expect(await tryAccess(local.http, local.waiter.email, NEW)).toBe(200)
  expect(await tryAccess(local.http, local.waiter.email, NEW_SECRET)).toBe(401)
})
