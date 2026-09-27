// HU03, HU04: las cuentas del personal. Alta con rol y contraseña inicial,
// edición, contraseña restablecida, desactivar (ya no entra) y activar; la
// cuenta propia no cambia su rol ni se desactiva.
import { CLAVE_NUEVA } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, fallaServidor, intentarAcceso, nuevaCuenta } from '../soporte/gestion'

const OTRA_CLAVE = 'otra-clave-e2e-2026'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-15 el encargado da de alta una cuenta, la edita, le restablece la contraseña, la desactiva y la vuelve a activar', async ({ page, local }) => {
  cubre(
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
  const correo = `lucia-${String(Date.now())}-${String(test.info().parallelIndex)}@e2e.resthub.dev`
  await abrirComo(page, local.encargado, '/personal')
  await expect(page.getByRole('heading', { level: 1, name: 'Personal' })).toBeVisible()
  await expect(page.getByRole('row', { name: /Encargada Prueba \(tú\)/u })).toBeVisible()

  await page.getByRole('button', { name: 'Nueva cuenta' }).click()
  const alta = page.getByRole('dialog', { name: 'Nueva cuenta' })
  await expect(alta.getByLabel('Rol')).toHaveValue(/\d+/u)
  await expect(alta.getByLabel('Rol').locator('option:checked')).toHaveText('Mesero')
  await alta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(alta.getByText('Escribe el nombre completo')).toBeVisible()
  await expect(alta.getByText(/Escribe un correo válido/u)).toBeVisible()
  await alta.getByLabel('Nombre completo').fill('Lucía Ramos')
  await alta.getByLabel('Correo').fill(local.mesero.email)
  await alta.getByLabel('Contraseña inicial').fill(CLAVE_NUEVA)
  await alta.getByRole('button', { name: 'Crear cuenta' }).click()
  // El diálogo muestra además el aviso general de que no se guardó; se busca el motivo del servidor.
  await expect(alta.getByRole('alert').filter({ hasNotText: 'No se pudo guardar. Los datos siguen aquí' })).toBeVisible()
  await evidencia(page, 'ges-15-1-correo-repetido')
  await alta.getByLabel('Correo').fill(correo)
  await alta.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(alta).toBeHidden()
  const fila = page.getByRole('row', { name: /Lucía Ramos/u })
  await expect(fila).toContainText('Mesero')
  await expect(fila).toContainText('Activa')
  expect(await intentarAcceso(local.http, correo, CLAVE_NUEVA)).toBe(200)

  // Pasa a la cocina.
  await fila.getByRole('button', { name: 'Editar' }).click()
  const edicion = page.getByRole('dialog', { name: 'Editar a Lucía Ramos' })
  await expect(edicion.getByText(correo)).toBeVisible()
  await edicion.getByLabel('Rol').selectOption({ label: 'Cocinero' })
  await edicion.getByRole('button', { name: 'Guardar' }).click()
  await expect(edicion).toBeHidden()
  await expect(fila).toContainText('Cocinero')

  await fila.getByRole('button', { name: 'Contraseña' }).click()
  const clave = page.getByRole('dialog', { name: 'Restablecer la contraseña de Lucía Ramos' })
  await clave.getByLabel('Nueva contraseña').fill('corta')
  await clave.getByRole('button', { name: 'Restablecer' }).click()
  await expect(clave.getByLabel('Nueva contraseña')).toHaveAttribute('aria-invalid', 'true')
  await clave.getByLabel('Nueva contraseña').fill(OTRA_CLAVE)
  await clave.getByRole('button', { name: 'Restablecer' }).click()
  await expect(aviso(page, 'Contraseña de Lucía Ramos restablecida.')).toBeVisible()
  expect(await intentarAcceso(local.http, correo, CLAVE_NUEVA)).toBe(401)
  expect(await intentarAcceso(local.http, correo, OTRA_CLAVE)).toBe(200)

  // Desactivar se confirma: desde ese momento no entra.
  await fila.getByRole('button', { name: 'Desactivar' }).click()
  const confirmar = page.getByRole('alertdialog', { name: '¿Desactivar a Lucía Ramos?' })
  await evidencia(page, 'ges-15-2-desactivar')
  await confirmar.getByRole('button', { name: 'Desactivar' }).click()
  await expect(fila).toContainText('Inactiva')
  expect(await intentarAcceso(local.http, correo, OTRA_CLAVE)).not.toBe(200)
  await fila.getByRole('button', { name: 'Activar' }).click()
  await expect(fila).toContainText('Activa')
  await expect.poll(() => intentarAcceso(local.http, correo, OTRA_CLAVE)).toBe(200)

  // La cuenta propia: el rol no se cambia y no se desactiva ni restablece acá.
  const propia = page.getByRole('row', { name: /Encargada Prueba \(tú\)/u })
  await expect(propia.getByRole('button', { name: 'Desactivar' })).toBeDisabled()
  await expect(propia.getByRole('button', { name: 'Contraseña' })).toHaveCount(0)
  await propia.getByRole('button', { name: 'Editar' }).click()
  const mia = page.getByRole('dialog', { name: 'Editar a Encargada Prueba' })
  await expect(mia.getByText('No puedes cambiar el rol de tu propia cuenta.')).toBeVisible()
  await expect(mia.getByLabel('Rol')).toHaveCount(0)
  await mia.getByRole('button', { name: 'Cancelar' }).click()
  await expect(mia).toBeHidden()
})

test('GES-16 la tabla del personal se pagina y avisa si el servidor falla', async ({ page, local }) => {
  cubre('funcion:personal.paginar', 'estado:personal.error')
  const roles = await api(local).lista('/roles')
  const mesero = Number(roles.find((rol) => rol.kind === 'waiter')?.id)
  for (let n = 1; n <= 13; n += 1) {
    await nuevaCuenta(local, `Ayudante ${String.fromCodePoint(64 + n)}`, mesero)
  }
  await abrirComo(page, local.encargado, '/personal')
  const paginas = page.getByRole('navigation', { name: 'Paginación' })
  await expect(paginas).toContainText('Página 1 de 2')
  await expect(page.getByRole('row')).toHaveCount(16)
  await paginas.getByRole('button', { name: 'Siguiente' }).click()
  await expect(paginas).toContainText('Página 2 de 2')
  await expect(page.getByRole('row')).toHaveCount(2)
  await expect(page.getByRole('row', { name: /Mesero Prueba/u })).toBeVisible()
  await evidencia(page, 'ges-16-1-personal-pagina-2')

  await fallaServidor(page, '/staff')
  await page.reload()
  await expect(page.getByText('No se pudo cargar el personal.')).toBeVisible()
})
