// Acceso por el formulario, navegación por rol, permisos y cierre de sesión.
//
// Las cuentas de la semilla entran por el formulario de verdad (HU01). Los
// errores de contraseña se prueban con cuentas del restaurante propio de cada
// prueba, para no acercarse al límite de intentos fallidos de la semilla.
import { CLAVE, SEMILLA } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, evidencia, expect, test } from '../soporte/fixtures'
import {
  colaGuardada,
  duenaDe,
  encolarPedidos,
  entrarPorFormulario,
  navegacion,
  secciones,
  sinEnvioDePedidos,
} from '../soporte/plataforma'

const TODAS = [
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
const DEL_MESERO = ['Pedidos', 'Cocina', 'Reservas', 'Clientes']
const DE_COCINA = ['Tablero', 'Inventario']
const ERROR_CREDENCIALES = 'El correo o la contraseña no son correctos.'

test('ACC-01 el encargado de la semilla entra por el formulario y ve todas las secciones', async ({ page }) => {
  cubre('ruta:/acceso', 'ruta:/', 'funcion:acceso.entrar', 'funcion:inicio.redirige-por-rol', 'funcion:permisos.navegacion-por-rol', 'rol:encargado')
  await page.goto('/')
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect(page.getByRole('heading', { name: 'Iniciar sesión', level: 1 })).toBeVisible()
  await evidencia(page, 'acc-01-formulario')
  await entrarPorFormulario(page, SEMILLA.encargado, CLAVE)
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect.poll(() => secciones(page)).toEqual(TODAS)
  await expect(page.getByText('Encargado Demo')).toBeVisible()
  await evidencia(page, 'acc-01-navegacion')
})

test('ACC-02 el mesero de la semilla entra y ve solo Pedidos, Cocina, Reservas y Clientes @movil', async ({ page }) => {
  cubre('funcion:acceso.entrar', 'funcion:permisos.navegacion-por-rol', 'rol:mesero')
  await page.goto('/acceso')
  await entrarPorFormulario(page, SEMILLA.mesero, CLAVE)
  await expect(page).toHaveURL(/\/pedidos$/u)
  await expect.poll(() => secciones(page)).toEqual(DEL_MESERO)
  const nav = navegacion(page)
  for (const prohibida of ['Tablero', 'Caja', 'Inventario', 'Personal', 'Panel BI']) {
    await expect(nav.getByRole('link', { name: prohibida })).toHaveCount(0)
  }
  if (test.info().project.name === 'movil') {
    // En el celular del mesero no sobra ninguna pantalla: el último botón es «Cuenta».
    await expect(nav.getByRole('button', { name: 'Cuenta' })).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Más' })).toHaveCount(0)
  }
  await evidencia(page, 'acc-02-navegacion-mesero')
})

test('ACC-03 la cuenta de cocina de la semilla entra al tablero y no toma pedidos', async ({ page }) => {
  cubre('funcion:acceso.entrar', 'funcion:inicio.redirige-por-rol', 'funcion:permisos.ruta-prohibida', 'rol:cocina')
  await page.goto('/acceso')
  await entrarPorFormulario(page, SEMILLA.cocina, CLAVE)
  await expect(page).toHaveURL(/\/tablero$/u)
  await expect.poll(() => secciones(page)).toEqual(DE_COCINA)
  await evidencia(page, 'acc-03-navegacion-cocina')
  // Sin `orders.take` la toma de pedidos no se abre: vuelve a su inicio.
  await page.goto('/pedidos')
  await expect(page).toHaveURL(/\/tablero$/u)
  await page.goto('/caja')
  await expect(page).toHaveURL(/\/tablero$/u)
})

test('ACC-04 el administrador del sistema entra por su formulario y cierra su sesión', async ({ page }) => {
  cubre(
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
  await evidencia(page, 'acc-04-acceso-plataforma')
  await entrarPorFormulario(page, SEMILLA.plataforma, CLAVE)
  await expect(page).toHaveURL(/\/plataforma$/u)
  await expect(page.getByRole('heading', { name: 'Restaurantes', level: 1 })).toBeVisible()
  const area = page.getByRole('navigation', { name: 'Administración del sistema' })
  await expect(area.getByRole('link')).toHaveText(['Restaurantes', 'Bitácora', 'Vista previa', 'Observabilidad'])
  await expect(area.getByRole('link', { name: 'Restaurantes' })).toHaveAttribute('aria-current', 'page')
  await evidencia(page, 'acc-04-restaurantes')
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/plataforma\/acceso$/u)
  await expect(page.getByLabel('Correo')).toBeEmpty()
  await page.getByRole('link', { name: 'Ir al acceso de restaurantes' }).click()
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible()
})

test('ACC-05 una contraseña equivocada muestra el error y no abre sesión @movil', async ({ page, local }) => {
  cubre('ruta:/acceso', 'estado:acceso.error', 'funcion:acceso.validar', 'funcion:acceso.mostrar-contrasena', 'funcion:acceso.entrar')
  await page.goto('/acceso')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByText('Escribe un correo válido, como nombre@correo.com')).toBeVisible()
  await expect(page.getByText('Escribe tu contraseña')).toBeVisible()
  await entrarPorFormulario(page, local.mesero.email, 'no-es-la-clave-123')
  await expect(page.getByText(ERROR_CREDENCIALES)).toBeVisible()
  await expect(page).toHaveURL(/\/acceso$/u)
  await evidencia(page, 'acc-05-error')
  const clave = page.getByLabel('Contraseña', { exact: true })
  await clave.fill(local.mesero.password)
  await expect(clave).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Mostrar contraseña' }).click()
  await expect(clave).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Ocultar contraseña' }).click()
  await expect(clave).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/pedidos$/u)
})

test('ACC-06 cerrar sesión lleva al acceso y, al volver a entrar, a la pantalla pedida', async ({ page, local }) => {
  cubre('funcion:sesion.cerrar', 'funcion:permisos.sin-sesion', 'funcion:acceso.volver-a-destino', 'funcion:acceso.entrar')
  await abrirComo(page, local.encargado, '/tablero')
  await expect(page.getByRole('heading', { name: 'Tablero', level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/acceso$/u)
  await expect.poll(() => page.evaluate(() => localStorage.getItem('resthub.session.v2'))).toBeNull()
  // Sin sesión, una pantalla privada lleva al acceso y recuerda a dónde se iba.
  await page.goto('/inventario')
  await expect(page).toHaveURL(/\/acceso$/u)
  await evidencia(page, 'acc-06-sin-sesion')
  await entrarPorFormulario(page, local.encargado.email, local.encargado.password)
  await expect(page).toHaveURL(/\/inventario$/u)
  await expect(page.getByRole('heading', { name: 'Inventario', level: 1 })).toBeVisible()
})

test('ACC-07 el mesero no ve Inventario ni Caja y esas rutas lo llevan a Pedidos @movil', async ({ page, local }) => {
  cubre('funcion:permisos.ruta-prohibida', 'funcion:permisos.navegacion-por-rol', 'rol:mesero')
  await abrirComo(page, local.mesero, '/pedidos')
  await expect.poll(() => secciones(page)).toEqual(DEL_MESERO)
  for (const prohibida of ['/inventario', '/caja', '/tablero', '/personal', '/panel']) {
    await page.goto(prohibida)
    await expect(page).toHaveURL(/\/pedidos$/u)
  }
  await evidencia(page, 'acc-07-ruta-prohibida')
})

test('ACC-08 una ruta que no existe lleva al inicio de la cuenta @movil', async ({ page, local }) => {
  cubre('ruta:/*')
  await abrirComo(page, local.mesero, '/esto-no-existe')
  await expect(page).toHaveURL(/\/pedidos$/u)
  await page.goto('/pedidos/otra/cosa/que/no/existe')
  await expect(page).toHaveURL(/\/pedidos$/u)
})

test('ACC-09 cerrar sesión con pedidos sin enviar avisa y conserva la cola @movil', async ({ page, local }) => {
  cubre('confirmacion:shell/SessionActions', 'funcion:sesion.cerrar-con-pendientes', 'funcion:sesion.cerrar')
  await sinEnvioDePedidos(page)
  await abrirComo(page, local.mesero, '/perfil')
  await encolarPedidos(page, duenaDe(local.mesero), [
    { mesa: local.mesa('2'), plato: local.plato('Lomo saltado') },
    { mesa: local.mesa('3'), plato: local.plato('Chicha morada') },
  ])
  await page.reload()
  const enCelular = test.info().project.name === 'movil'
  const abrirSalida = async () => {
    if (enCelular) {
      await navegacion(page).getByRole('button', { name: 'Cuenta' }).click()
      await page.getByRole('dialog', { name: 'Cuenta' }).getByRole('button', { name: 'Cerrar sesión' }).click()
      return
    }
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }
  await abrirSalida()
  const aviso = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(aviso).toContainText('2 pedidos tuyos esperan señal: Mesa 2, Mesa 3')
  await evidencia(page, 'acc-09-aviso-pendientes')
  await aviso.getByRole('button', { name: 'Cancelar' }).click()
  await expect(aviso).toBeHidden()
  await expect(page).toHaveURL(/\/perfil$/u)
  if (enCelular) {
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Cuenta' })).toBeHidden()
  }
  await abrirSalida()
  await aviso.getByRole('button', { name: 'Cerrar sesión' }).click()
  await expect(page).toHaveURL(/\/acceso$/u)
  // Los pedidos no se borran: se envían cuando esa cuenta vuelva a entrar.
  expect(await colaGuardada(page)).toBe(2)
})

test('ACC-10 la hoja «Más» del celular abre las otras pantallas, la accesibilidad y el perfil @solo-movil', async ({ page, local }) => {
  cubre('hoja:shell/MoreSheet', 'funcion:shell.mas-navegar', 'funcion:shell.mas-accesibilidad', 'funcion:shell.mas-perfil', 'rol:encargado')
  await abrirComo(page, local.encargado, '/pedidos')
  const nav = navegacion(page)
  await expect.poll(() => secciones(page)).toEqual(TODAS.slice(0, 4))
  await nav.getByRole('button', { name: 'Más' }).click()
  const hoja = page.getByRole('dialog', { name: 'Más' })
  await expect(hoja.getByRole('link')).toHaveText([...TODAS.slice(4), 'Encargada PruebaEncargado'])
  await evidencia(page, 'acc-10-hoja-mas')
  await hoja.getByRole('link', { name: 'Inventario' }).click()
  await expect(hoja).toBeHidden()
  await expect(page).toHaveURL(/\/inventario$/u)
  await expect(page.getByRole('heading', { name: 'Inventario', level: 1 })).toBeVisible()

  await nav.getByRole('button', { name: 'Más' }).click()
  await hoja.getByRole('button', { name: 'Accesibilidad' }).click()
  await expect(hoja).toBeHidden()
  const cerrarWidget = page.getByRole('button', { name: 'Cerrar menú de accesibilidad' })
  await expect(cerrarWidget).toBeVisible()
  await cerrarWidget.click()
  await expect(cerrarWidget).toBeHidden()

  await nav.getByRole('button', { name: 'Más' }).click()
  await hoja.getByRole('link', { name: /Encargada Prueba/u }).click()
  await expect(page).toHaveURL(/\/perfil$/u)
  await expect(hoja).toBeHidden()
})
