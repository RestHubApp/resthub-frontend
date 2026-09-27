// HU39, HU03: los roles del restaurante. El encargado es fijo, el mesero
// cambia sus permisos pero no su nombre, un rol propio se crea, se edita y se
// borra si nadie lo tiene, y nadie da permisos que no tiene.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, fallaServidor, nuevaCuenta } from '../soporte/gestion'

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-17 el encargado crea un rol con permisos, edita el del mesero, ve que el encargado es fijo y que un rol con personas no se borra, y elimina el suyo', async ({ page, local }) => {
  cubre(
    'ruta:/roles',
    'dialogo:roles/RoleFormDialog',
    'confirmacion:roles/DeleteRoleButton',
    'funcion:roles.crear',
    'funcion:roles.editar-permisos',
    'funcion:roles.eliminar',
    'funcion:roles.no-se-borra-con-personas',
    'funcion:roles.encargado-fijo',
    'funcion:roles.mesero-sin-renombrar',
  )
  await abrirComo(page, local.encargado, '/roles')
  await expect(page.getByRole('heading', { level: 1, name: 'Roles y permisos' })).toBeVisible()
  await expect(page.getByText('3 roles')).toBeVisible()
  const rol = (nombre: string) => page.getByRole('main').getByRole('listitem').filter({ has: page.getByText(nombre, { exact: true }) })
  await expect(rol('Encargado')).toContainText('Fijo')
  await expect(rol('Encargado')).toContainText('Todos los permisos')

  // El encargado solo se mira.
  await page.getByRole('button', { name: 'Ver permisos del rol Encargado' }).click()
  const fijo = page.getByRole('dialog', { name: 'Encargado' })
  await expect(fijo).toContainText('El encargado siempre tiene todos los permisos')
  await expect(fijo.getByRole('checkbox', { name: 'Abrir y cerrar la caja y ver sus arqueos' })).toBeDisabled()
  await expect(fijo.getByRole('checkbox', { name: 'Abrir y cerrar la caja y ver sus arqueos' })).toBeChecked()
  await fijo.getByRole('button', { name: 'Cerrar', exact: true }).first().click()
  await expect(fijo).toBeHidden()

  // Un rol con personas no ofrece eliminarse.
  await expect(rol('Cocinero')).toContainText('1 persona')
  await expect(page.getByRole('button', { name: 'Eliminar el rol Cocinero' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Eliminar el rol Mesero' })).toHaveCount(0)

  // Al mesero se le suma un permiso; su nombre no cambia.
  await page.getByRole('button', { name: 'Editar el rol Mesero' }).click()
  const mesero = page.getByRole('dialog', { name: 'Editar Mesero' })
  await expect(mesero.getByText('Es el rol base del mesero: su nombre no cambia, sus permisos sí.')).toBeVisible()
  const verTodos = mesero.getByRole('checkbox', { name: 'Ver todos los pedidos del local' })
  await expect(verTodos).not.toBeChecked()
  await verTodos.click()
  await expect(verTodos).toBeChecked()
  await mesero.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Rol Mesero guardado.')).toBeVisible()
  const roles = async () => api(local).lista('/roles')
  expect((await roles()).find((r) => r.kind === 'waiter')?.permissions).toContain('orders.read_all')

  // Un rol propio: Caja.
  await page.getByRole('button', { name: 'Nuevo rol' }).click()
  const nuevo = page.getByRole('dialog', { name: 'Nuevo rol' })
  await nuevo.getByRole('button', { name: 'Guardar' }).click()
  await expect(nuevo.getByText('Escribe el nombre del rol')).toBeVisible()
  await nuevo.getByLabel('Nombre').fill('Caja')
  await nuevo.getByRole('checkbox', { name: 'Abrir y cerrar la caja y ver sus arqueos' }).click()
  await nuevo.getByRole('checkbox', { name: 'Cobrar pedidos y dar descuentos hasta el tope del mesero' }).click()
  await nuevo.getByRole('checkbox', { name: 'Ver todos los pedidos del local' }).click()
  await evidencia(page, 'ges-17-1-nuevo-rol')
  await nuevo.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Rol Caja creado.')).toBeVisible()
  await expect(rol('Caja')).toContainText('Personalizado')
  await expect(rol('Caja')).toContainText('Nadie lo tiene · 3 permisos · Pedidos y Caja')
  await expect(page.getByText('4 roles')).toBeVisible()

  await page.getByRole('button', { name: 'Editar el rol Caja' }).click()
  const edicion = page.getByRole('dialog', { name: 'Editar Caja' })
  await expect(edicion.getByRole('checkbox', { name: 'Ver todos los pedidos del local' })).toBeChecked()
  await edicion.getByRole('checkbox', { name: 'Ver todos los pedidos del local' }).click()
  await edicion.getByRole('button', { name: 'Guardar' }).click()
  await expect(aviso(page, 'Rol Caja guardado.')).toBeVisible()
  await expect(rol('Caja')).toContainText('2 permisos · Caja')
  await evidencia(page, 'ges-17-2-roles')

  await page.getByRole('button', { name: 'Eliminar el rol Caja' }).click()
  const eliminar = page.getByRole('alertdialog', { name: '¿Eliminar el rol Caja?' })
  await eliminar.getByRole('button', { name: 'Eliminar' }).click()
  await expect(aviso(page, 'Rol Caja eliminado.')).toBeVisible()
  await expect(rol('Caja')).toBeHidden()
  expect((await roles()).map((r) => r.name)).not.toContain('Caja')
})

test('GES-18 quien administra personal y roles sin todos los permisos no da lo que no tiene', async ({ page, local }) => {
  cubre('funcion:roles.permisos-que-no-tiene', 'funcion:personal.roles-que-puede-dar', 'estado:roles.error')
  const administracion = await api(local).post('/roles', {
    name: 'Administración',
    permissions: ['menu.read', 'staff.manage', 'roles.manage'],
  })
  const admin = await nuevaCuenta(local, 'Admin Parcial', Number(administracion.id))
  await abrirComo(page, admin, '/roles')

  // El encargado y el cocinero tienen permisos que esta cuenta no tiene: solo se miran.
  await expect(page.getByRole('listitem').filter({ hasText: 'Cocinero' })).toContainText('Tiene permisos que tu cuenta no tiene.')
  await page.getByRole('button', { name: 'Ver permisos del rol Cocinero' }).click()
  const cocinero = page.getByRole('dialog', { name: 'Cocinero' })
  await expect(cocinero).toContainText('Tiene permisos que tu cuenta no tiene, así que solo puedes mirarlo.')
  await expect(cocinero.getByRole('button', { name: 'Guardar' })).toHaveCount(0)
  await cocinero.getByRole('button', { name: 'Cerrar', exact: true }).first().click()

  await page.getByRole('button', { name: 'Nuevo rol' }).click()
  const nuevo = page.getByRole('dialog', { name: 'Nuevo rol' })
  const tomar = nuevo.getByRole('checkbox', { name: 'Tomar pedidos, agregar platos y marcarlos servidos' })
  await expect(tomar).toBeDisabled()
  await expect(nuevo.getByText('Tu cuenta no tiene este permiso, así que no puedes darlo.').first()).toBeVisible()
  await expect(nuevo.getByRole('checkbox', { name: 'Ver el menú' })).toBeEnabled()
  await evidencia(page, 'ges-18-1-permisos-apagados')
  await nuevo.getByRole('button', { name: 'Cancelar' }).click()

  // En Personal solo ofrece los roles que puede dar y no toca las cuentas más fuertes.
  await page.goto('/personal')
  await expect(page.getByRole('row', { name: /Mesero Prueba/u })).toContainText('Su rol tiene permisos que tu cuenta no tiene')
  await page.getByRole('button', { name: 'Nueva cuenta' }).click()
  const opciones = page.getByRole('dialog', { name: 'Nueva cuenta' }).getByLabel('Rol').locator('option')
  await expect(opciones).toHaveText(['Administración'])
  await page.keyboard.press('Escape')

  await fallaServidor(page, '/roles')
  await page.goto('/roles')
  await expect(page.getByText('No se pudieron cargar los roles.')).toBeVisible()
})
