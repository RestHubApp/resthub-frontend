// El área de plataforma: su acceso y su guarda, la bitácora y lo que se ve
// cuando una lectura falla o no encuentra nada.
import type { Page } from '@playwright/test'

import { CLAVE, Cliente, SEMILLA, unico } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, abrirComoPlataforma, evidencia, expect, test } from '../soporte/fixtures'
import { bitacoraConPaginas, entrarPorFormulario } from '../soporte/plataforma'

const FALLA = { status: 500, contentType: 'application/json', body: '{}' }

/** Hace fallar las lecturas de esa ruta del API hasta `soltar()`. */
async function fallar(page: Page, patron: string | RegExp) {
  await page.route(patron, (ruta) => ruta.fulfill(FALLA))
  return async () => {
    await page.unroute(patron)
  }
}

test('PLA-07 la bitácora registra lo que hace el administrador y se pagina', async ({ page, plataforma, local }) => {
  cubre('ruta:/plataforma/bitacora', 'funcion:plataforma.bitacora.ver', 'funcion:plataforma.bitacora.paginar')
  const api = new Cliente(local.http, plataforma.token)
  const nombre = `Bitácora ${unico()}`
  await api.patch(`/platform/restaurants/${String(local.id)}`, { name: nombre })
  await bitacoraConPaginas(local.http, api)
  await abrirComoPlataforma(page, plataforma, '/plataforma')
  await page.getByRole('navigation', { name: 'Administración del sistema' }).getByRole('link', { name: 'Bitácora' }).click()
  await expect(page).toHaveURL(/\/plataforma\/bitacora$/u)
  await expect(page.getByRole('heading', { name: 'Bitácora', level: 1 })).toBeVisible()
  const edicion = page.getByRole('row').filter({ hasText: `nombre «${nombre}»` })
  await expect(edicion).toContainText('Editó un restaurante')
  await expect(edicion).toContainText('Administración RestHub')
  await expect(edicion).toContainText(local.slug)
  await evidencia(page, 'pla-07-bitacora')
  await expect(page.getByText(/^Página 1 de \d+$/u)).toBeVisible()
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await expect(page.getByText(/^Página 2 de \d+$/u)).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Inició sesión' }).first()).toBeVisible()
})

test('PLA-08 el acceso de plataforma rechaza credenciales equivocadas y su guarda vuelve a la pantalla pedida', async ({ page, local }) => {
  cubre(
    'estado:plataforma.acceso-error',
    'funcion:plataforma.sin-sesion',
    'funcion:plataforma.sesion-separada',
    'funcion:plataforma.entrar',
    'ruta:/plataforma/*',
    'ruta:/plataforma/bitacora',
  )
  // Una sesión de restaurante abierta no entra al área de plataforma.
  await abrirComo(page, local.encargado, '/plataforma/bitacora')
  await expect(page).toHaveURL(/\/plataforma\/acceso$/u)
  await entrarPorFormulario(page, `nadie-${unico()}@resthub.pe`, 'no-es-la-clave-1')
  await expect(page.getByText('El correo o la contraseña no son correctos.')).toBeVisible()
  await evidencia(page, 'pla-08-error')
  await entrarPorFormulario(page, SEMILLA.plataforma, CLAVE)
  // El acceso compara la contraseña con bcrypt; con las demás pruebas dando de
  // alta restaurantes a la vez (cuatro accesos con bcrypt cada una) llegó a
  // tardar más de 8 s en la máquina compartida.
  await expect(page).toHaveURL(/\/plataforma\/bitacora$/u, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: 'Bitácora', level: 1 })).toBeVisible()
  await page.goto('/plataforma/esto-no-existe')
  await expect(page).toHaveURL(/\/plataforma$/u)
  // La sesión del restaurante sigue ahí, aparte.
  await page.goto('/tablero')
  await expect(page.getByRole('heading', { name: 'Tablero', level: 1 })).toBeVisible()
})

test('PLA-09 la lista, la ficha y la bitácora avisan cuando no cargan y se reintentan', async ({ page, plataforma, local }) => {
  cubre(
    'estado:plataforma.restaurantes.error',
    'estado:plataforma.restaurante.no-existe',
    'estado:plataforma.restaurante.error',
    'estado:plataforma.bitacora.error',
  )
  let soltar = await fallar(page, /\/api\/v1\/platform\/restaurants\?/u)
  await abrirComoPlataforma(page, plataforma, '/plataforma')
  await expect(page.getByText('No se pudo cargar la lista.')).toBeVisible()
  await evidencia(page, 'pla-09-lista-error')
  await soltar()
  await page.getByRole('main').getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: /^\d+ restaurantes?$/u })).toBeVisible()

  await page.goto('/plataforma/restaurantes/999999999')
  await expect(page.getByText('Este restaurante no existe.')).toBeVisible()
  await page.goto('/plataforma/restaurantes/no-es-un-numero')
  await expect(page.getByText('Este restaurante no existe.')).toBeVisible()
  await evidencia(page, 'pla-09-no-existe')

  soltar = await fallar(page, `**/api/v1/platform/restaurants/${String(local.id)}`)
  await page.goto(`/plataforma/restaurantes/${String(local.id)}`)
  await expect(page.getByText('No se pudo cargar el restaurante.')).toBeVisible()
  await soltar()
  await page.getByRole('main').getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('heading', { name: local.nombre, level: 1 })).toBeVisible()

  soltar = await fallar(page, '**/api/v1/platform/activity**')
  await page.goto('/plataforma/bitacora')
  await expect(page.getByText('No se pudo cargar la bitácora.')).toBeVisible()
  await soltar()
  await page.getByRole('main').getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByRole('row').filter({ hasText: 'Inició sesión' }).first()).toBeVisible()
})

test('PLA-10 la vista previa avisa si el local de muestra no carga o todavía no existe', async ({ page, plataforma }) => {
  cubre('estado:plataforma.vista-previa.error', 'estado:plataforma.vista-previa.sin-muestra', 'ruta:/plataforma/vista-previa')
  const soltar = await fallar(page, '**/api/v1/platform/sandbox')
  await abrirComoPlataforma(page, plataforma, '/plataforma/vista-previa')
  await expect(page.getByText('No se pudo cargar el local de muestra.')).toBeVisible()
  await evidencia(page, 'pla-10-error')
  await soltar()
  // Sin local de muestra todavía: lo crea la primera vista previa o el reinicio.
  await page.route('**/api/v1/platform/sandbox', (ruta) =>
    ruta.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ restaurant: null, accounts: [] }) }),
  )
  await page.getByRole('main').getByRole('button', { name: 'Reintentar' }).click()
  await expect(page.getByText('Todavía no hay local de muestra.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ver como encargado' })).toBeEnabled()
  await evidencia(page, 'pla-10-sin-muestra')
})
