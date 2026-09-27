// HU02: la cuenta propia. Los datos se leen; la contraseña se cambia pidiendo
// la actual. Se usa el mesero del restaurante de la prueba, nunca una cuenta
// de la semilla.
import { CLAVE_NUEVA } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'
import { intentarAcceso } from '../soporte/gestion'

const NUEVA = 'mesero-nueva-clave-2026'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-31 el mesero ve sus datos y cambia su contraseña pidiendo la actual @movil', async ({ page, local }) => {
  cubre(
    'ruta:/perfil',
    'funcion:perfil.ver-datos',
    'funcion:perfil.cambiar-contrasena',
    'funcion:perfil.validar-contrasena',
    'funcion:perfil.contrasena-actual-incorrecta',
  )
  await abrirComo(page, local.mesero, '/perfil')
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
  const dato = (termino: string) => page.getByRole('term').filter({ hasText: termino }).locator('xpath=following-sibling::dd')
  await expect(dato('Nombre')).toHaveText('Mesero Prueba')
  await expect(dato('Correo')).toHaveText(local.mesero.email)
  await expect(dato('Rol')).toHaveText('Mesero')
  await expect(dato('Restaurante')).toHaveText('Restaurante E2E')

  const actual = page.getByLabel('Contraseña actual', { exact: true })
  const nueva = page.getByLabel('Nueva contraseña', { exact: true })
  const repetida = page.getByLabel('Repite la nueva contraseña')
  const cambiar = page.getByRole('button', { name: 'Cambiar contraseña' })
  await cambiar.click()
  await expect(page.getByText('Escribe tu contraseña actual')).toBeVisible()
  await actual.fill(CLAVE_NUEVA)
  await nueva.fill(NUEVA)
  await repetida.fill('otra-cosa-distinta')
  await cambiar.click()
  await expect(page.getByText('Las dos contraseñas no coinciden')).toBeVisible()
  await nueva.fill(CLAVE_NUEVA)
  await repetida.fill(CLAVE_NUEVA)
  await cambiar.click()
  await expect(page.getByText('La nueva contraseña tiene que ser distinta de la actual')).toBeVisible()
  await nueva.fill('corta')
  await repetida.fill('corta')
  await cambiar.click()
  await expect(nueva).toHaveAttribute('aria-invalid', 'true')
  await evidencia(page, 'ges-31-1-validaciones')

  // Con la actual equivocada no cambia nada.
  await actual.fill('no-es-la-clave-123')
  await nueva.fill(NUEVA)
  await repetida.fill(NUEVA)
  await cambiar.click()
  await expect(page.getByRole('alert').filter({ hasText: /contraseña/iu })).toBeVisible()
  expect(await intentarAcceso(local.http, local.mesero.email, CLAVE_NUEVA)).toBe(200)

  await page.getByRole('button', { name: 'Mostrar contraseña' }).first().click()
  await expect(actual).toHaveAttribute('type', 'text')
  await actual.fill(CLAVE_NUEVA)
  await cambiar.click()
  await expect(page.getByText('Contraseña actualizada.')).toBeVisible()
  await expect(actual).toHaveValue('')
  await evidencia(page, 'ges-31-2-cambiada')
  expect(await intentarAcceso(local.http, local.mesero.email, NUEVA)).toBe(200)
  expect(await intentarAcceso(local.http, local.mesero.email, CLAVE_NUEVA)).toBe(401)
})
