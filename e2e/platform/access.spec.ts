// Acceso por el formulario, navegación por rol, permisos y cierre de sesión.
//
// Las cuentas de la semilla entran por el formulario de verdad (HU01). Los
// errores de contraseña se prueban con cuentas del restaurante propio de cada
// prueba, para no acercarse al límite de intentos fallidos de la semilla.
import { SECRET, signInByApi, newHttp, SEED } from '../support/api'
import { covers } from '../support/coverage'
import { openAs, evidence, expect, test } from '../support/fixtures'
import {
  savedQueue,
  ownerOf,
  enqueueOrders,
  signInByForm,
  navigation,
  sections,
  withoutOrdersSending,
} from '../support/platform'

// Las cuentas de la semilla ya aceptaron los términos: así estas pruebas miden
// la navegación por rol y no dependen de cuál entra primero. La pantalla de
// términos se prueba con el encargado recién creado (PLA-01).
test.beforeAll(async () => {
  const http = await newHttp()
  for (const email of [SEED.owner, SEED.waiter, SEED.kitchen]) {
    await signInByApi(http, email, SECRET)
  }
  await http.dispose()
})

const ALL = [
  'Pedidos',
  'Tablero',
  'Cocina',
  'Reservas',
  'Clientes',
  'Caja',
  'Comprobantes',
  'Menú',
  'Mesas',
  'Inventario',
  'Personal',
  'Roles',
  'Panel BI',
]
const OF_WAITER = ['Pedidos', 'Cocina', 'Reservas', 'Clientes']
const OF_KITCHEN = ['Tablero', 'Inventario']
const ERROR_CREDENTIALS = 'El correo o la contraseña no son correctos.'

test('ACC-01 el encargado de la semilla entra por el formulario y ve todas las secciones', async ({ page }) => {
  covers('ruta:/acceso', 'ruta:/', 'funcion:acceso.entrar', 'funcion:inicio.redirige-por-rol', 'funcion:permisos.navegacion-por-rol', 'rol:encargado')
  await page.goto('/')
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect(page.getByRole('heading', { name: 'Iniciar sesión', level: 1 })).toBeVisible()
  await evidence(page, 'acc-01-formulario')
  await signInByForm(page, SEED.owner, SECRET)
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect.poll(() => sections(page)).toEqual(ALL)
  await expect(page.getByText('Encargado Demo')).toBeVisible()
  await evidence(page, 'acc-01-navegacion')
})

test('ACC-02 el mesero de la semilla entra y ve solo Pedidos, Cocina, Reservas y Clientes @mobile', async ({ page }) => {
  covers('funcion:acceso.entrar', 'funcion:permisos.navegacion-por-rol', 'rol:mesero')
  await page.goto('/acceso')
  await signInByForm(page, SEED.waiter, SECRET)
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect.poll(() => sections(page)).toEqual(OF_WAITER)
  const nav = navigation(page)
  for (const forbidden of ['Tablero', 'Caja', 'Inventario', 'Personal', 'Panel BI']) {
    await expect(nav.getByRole('link', { name: forbidden })).toHaveCount(0)
  }
  if (test.info().project.name === 'mobile') {
    // En el celular del mesero no sobra ninguna pantalla: el último botón es «Cuenta».
    await expect(nav.getByRole('button', { name: 'Cuenta' })).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Más' })).toHaveCount(0)
  }
  await evidence(page, 'acc-02-navegacion-mesero')
})

test('ACC-03 la cuenta de cocina de la semilla entra al tablero y no toma pedidos', async ({ page }) => {
  covers('funcion:acceso.entrar', 'funcion:inicio.redirige-por-rol', 'funcion:permisos.ruta-prohibida', 'rol:cocina')
  await page.goto('/acceso')
  await signInByForm(page, SEED.kitchen, SECRET)
  await expect(page).toHaveURL(/\/tablero$/u)
  await expect.poll(() => sections(page)).toEqual(OF_KITCHEN)
  await evidence(page, 'acc-03-navegacion-cocina')
  // Sin `orders.take` la toma de pedidos no se abre: vuelve a su inicio.
  await page.goto('/pedidos')
  await expect(page).toHaveURL(/\/tablero$/u)
  await page.goto('/caja')
  await expect(page).toHaveURL(/\/tablero$/u)
})

test('ACC-04 el administrador del sistema entra por su formulario y cierra su sesión', async ({ page }) => {
  covers(
    'ruta:/plataforma/acceso',
    'ruta:/plataforma',
    'funcion:acceso.ir-a-plataforma',
    'funcion:plataforma.entrar',
    'funcion:plataforma.cerrar-sesion',
    'rol:plataforma',
  )
  await page.goto('/acceso')
  await page.getByRole('link', { name: 'Administración del sistema' }).click()
  await expect(page).toHaveURL(/\/plataforma\/acceso$/u)
  await expect(page.getByRole('heading', { name: 'Administración del sistema', level: 1 })).toBeVisible()
  await evidence(page, 'acc-04-acceso-plataforma')
  await signInByForm(page, SEED.platform, SECRET)
  await expect(page).toHaveURL(/\/plataforma$/u)
  await expect(page.getByRole('heading', { name: 'Restaurantes', level: 1 })).toBeVisible()
  const area = page.getByRole('navigation', { name: 'Administración del sistema' })
  await expect(area.getByRole('link')).toHaveText(['Restaurantes', 'Bitácora', 'Vista previa', 'Observabilidad'])
  await expect(area.getByRole('link', { name: 'Restaurantes' })).toHaveAttribute('aria-current', 'page')
  await evidence(page, 'acc-04-restaurantes')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/plataforma\/acceso$/u)
  await expect(page.getByLabel('Correo')).toBeEmpty()
  await page.getByRole('link', { name: 'Ir al acceso de restaurantes' }).click()
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
})

test('ACC-05 una contraseña equivocada muestra el error y no abre sesión @mobile', async ({ page, local }) => {
  covers('ruta:/acceso', 'estado:acceso.error', 'funcion:acceso.validar', 'funcion:acceso.mostrar-contrasena', 'funcion:acceso.entrar')
  await page.goto('/acceso')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('Escribe un correo válido, como nombre@correo.com')).toBeVisible()
  await expect(page.getByText('Escribe tu contraseña')).toBeVisible()
  await signInByForm(page, local.waiter.email, 'no-es-la-clave-123')
  await expect(page.getByText(ERROR_CREDENTIALS)).toBeVisible()
  await expect(page).toHaveURL(/\/acceso$/u)
  await evidence(page, 'acc-05-error')
  const password = page.getByLabel('Contraseña', { exact: true })
  await password.fill(local.waiter.password)
  await expect(password).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
  await expect(password).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pedidos$/u)
})

test('ACC-06 cerrar sesión lleva al acceso y, al volver a entrar, a la pantalla pedida', async ({ page, local }) => {
  covers('funcion:sesion.cerrar', 'funcion:permisos.sin-sesion', 'funcion:acceso.volver-a-destino', 'funcion:acceso.entrar')
  await openAs(page, local.owner, '/tablero')
  await expect(page.getByRole('heading', { name: 'Tablero', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('resthub.session.v2'))).toBeNull()
  // Sin sesión, una pantalla privada lleva al acceso y recuerda a dónde se iba.
  await page.goto('/inventario')
  await expect(page).toHaveURL(/\/acceso$/u)
  await evidence(page, 'acc-06-sin-sesion')
  await signInByForm(page, local.owner.email, local.owner.password)
  await expect(page).toHaveURL(/\/inventario$/u)
  await expect(page.getByRole('heading', { name: 'Inventario', level: 1 })).toBeVisible()
})

test('ACC-07 el mesero no ve Inventario ni Caja y esas rutas lo llevan a Pedidos @mobile', async ({ page, local }) => {
  covers('funcion:permisos.ruta-prohibida', 'funcion:permisos.navegacion-por-rol', 'rol:mesero')
  await openAs(page, local.waiter, '/pedidos')
  await expect.poll(() => sections(page)).toEqual(OF_WAITER)
  for (const forbidden of ['/inventario', '/caja', '/tablero', '/personal', '/panel']) {
    await page.goto(forbidden)
    await expect(page).toHaveURL(/\/pedidos$/u)
  }
  await evidence(page, 'acc-07-ruta-prohibida')
})

test('ACC-08 una ruta que no existe lleva al inicio de la cuenta @mobile', async ({ page, local }) => {
  covers('ruta:/*')
  await openAs(page, local.waiter, '/esto-no-existe')
  await expect(page).toHaveURL(/\/pedidos$/u)
  await page.goto('/pedidos/otra/cosa/que/no/existe')
  await expect(page).toHaveURL(/\/pedidos$/u)
})

test('ACC-09 cerrar sesión con pedidos sin enviar avisa y conserva la cola @mobile', async ({ page, local }) => {
  covers('confirmacion:shell/SessionActions', 'funcion:sesion.cerrar-con-pendientes', 'funcion:sesion.cerrar')
  await withoutOrdersSending(page)
  await openAs(page, local.waiter, '/perfil')
  await enqueueOrders(page, ownerOf(local.waiter), [
    { table: local.table('2'), dish: local.dish('Lomo saltado') },
    { table: local.table('3'), dish: local.dish('Chicha morada') },
  ])
  await page.reload()
  const inMobile = test.info().project.name === 'mobile'
  const openOutput = async () => {
    if (inMobile) {
      await navigation(page).getByRole('button', { name: 'Cuenta' }).click()
      await page.getByRole('dialog', { name: 'Cuenta' }).getByRole('button', { name: 'Cerrar sesión' }).click()
      return
    }
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }
  await openOutput()
  const notice = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(notice).toContainText('2 pedidos tuyos esperan señal: Mesa 2, Mesa 3')
  await evidence(page, 'acc-09-aviso-pendientes')
  await notice.getByRole('button', { name: 'Cancelar' }).click()
  await expect(notice).toBeHidden()
  await expect(page).toHaveURL(/\/perfil$/u)
  if (inMobile) {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Cuenta' })).toBeHidden()
  }
  await openOutput()
  await notice.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/acceso$/u)
  // Los pedidos no se borran: se envían cuando esa cuenta vuelva a entrar.
  expect(await savedQueue(page)).toBe(2)
})

test('ACC-10 la hoja «Más» del celular abre las otras pantallas, la accesibilidad y el perfil @only-mobile', async ({ page, local }) => {
  covers('hoja:shell/MoreSheet', 'funcion:shell.mas-navegar', 'funcion:shell.mas-accesibilidad', 'funcion:shell.mas-perfil', 'rol:encargado')
  await openAs(page, local.owner, '/pedidos')
  const nav = navigation(page)
  await expect.poll(() => sections(page)).toEqual(ALL.slice(0, 4))
  await nav.getByRole('button', { name: 'Más' }).click()
  const sheet = page.getByRole('dialog', { name: 'Más' })
  await expect(sheet.getByRole('link')).toHaveText([...ALL.slice(4), 'Encargada PruebaEncargado'])
  await evidence(page, 'acc-10-hoja-mas')
  await sheet.getByRole('link', { name: 'Inventario' }).click()
  await expect(sheet).toBeHidden()
  await expect(page).toHaveURL(/\/inventario$/u)
  await expect(page.getByRole('heading', { name: 'Inventario', level: 1 })).toBeVisible()

  await nav.getByRole('button', { name: 'Más' }).click()
  await sheet.getByRole('button', { name: 'Accesibilidad' }).click()
  await expect(sheet).toBeHidden()
  const closeWidget = page.getByRole('button', { name: 'Cerrar menú de accesibilidad' })
  await expect(closeWidget).toBeVisible()
  await closeWidget.click()
  await expect(closeWidget).toBeHidden()

  await nav.getByRole('button', { name: 'Más' }).click()
  await sheet.getByRole('link', { name: /Encargada Prueba/u }).click()
  await expect(page).toHaveURL(/\/perfil$/u)
  await expect(sheet).toBeHidden()
})

test('ACC-11 la política de privacidad se lee sin sesión desde el acceso @mobile', async ({ page }) => {
  covers('ruta:/privacidad')
  await page.goto('/acceso')
  await page.getByRole('link', { name: 'Privacidad' }).click()
  await expect(page).toHaveURL(/\/privacidad$/u)
  await expect(page.getByRole('heading', { name: 'Términos de uso y política de privacidad', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Tus derechos (ARCO)', level: 2 })).toBeVisible()
  await evidence(page, 'acc-privacidad')
})
