// HU02: la cuenta propia. Los datos se leen; la contraseña se cambia pidiendo
// la actual. Se usa el mesero del restaurante de la prueba, nunca una cuenta
// de la semilla.
import { NEW_SECRET } from '../soporte/api'
import { covers } from '../soporte/cobertura'
import { openAs, evidence, expect, test } from '../soporte/fixtures'
import { tryAccess } from '../soporte/gestion'

const NEW = 'mesero-nueva-clave-2026'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-31 el mesero ve sus datos y cambia su contraseña pidiendo la actual @movil', async ({ page, local }) => {
  covers(
    'ruta:/perfil',
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

  const actual = page.getByLabel('Contraseña actual', { exact: true })
  const fresh = page.getByLabel('Nueva contraseña', { exact: true })
  const repeated = page.getByLabel('Repite la nueva contraseña')
  const change = page.getByRole('button', { name: 'Cambiar contraseña' })
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

  await page.getByRole('button', { name: 'Mostrar contraseña' }).first().click()
  await expect(actual).toHaveAttribute('type', 'text')
  await actual.fill(NEW_SECRET)
  await change.click()
  await expect(page.getByText('Contraseña actualizada.')).toBeVisible()
  await expect(actual).toHaveValue('')
  await evidence(page, 'ges-31-2-cambiada')
  expect(await tryAccess(local.http, local.waiter.email, NEW)).toBe(200)
  expect(await tryAccess(local.http, local.waiter.email, NEW_SECRET)).toBe(401)
})
