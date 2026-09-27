// HU42: el administrador del sistema ve el tráfico, los errores, las
// latencias y los logs del backend en /plataforma/observabilidad.
import type { Page } from '@playwright/test'

import { API_ORIGIN, Cliente, nuevoHttp, type SesionPlataforma, unico } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComoPlataforma, evidencia, expect, test } from '../soporte/fixtures'

const OBS = '/plataforma/observabilidad'
// Una página de logs o de peticiones trae 50: con más, aparece «Cargar más».
const PAGINA = 50

/** La tarjeta de una sección del panel, por su título. */
function tarjeta(page: Page, titulo: string) {
  return page.locator('[data-slot="card"]').filter({ has: page.getByRole('heading', { name: titulo, exact: true }) })
}

/**
 * Deja al menos una página y media de advertencias en los logs: accesos
 * fallidos con correos que no existen (cada uno cuenta aparte en el límite de
 * intentos, así que ninguno llega al bloqueo).
 */
async function asegurarLogs(plataforma: SesionPlataforma): Promise<void> {
  const http = await nuevoHttp()
  const logs = await new Cliente(http, plataforma.token).lista('/platform/observability/logs?window=24h&limit=100')
  for (let i = logs.length; i < PAGINA + 5; i += 1) {
    await http.post(`${API_ORIGIN}/api/v1/auth/login`, {
      data: { email: `nadie-${unico()}@e2e.resthub.dev`, password: unico() },
    })
  }
  await http.dispose()
}

test('PLA-16 el panel de observabilidad muestra indicadores y gráficos, cambia de ventana y de restaurante', async ({
  page,
  plataforma,
  local,
}) => {
  cubre(
    'ruta:/plataforma/observabilidad',
    'funcion:observabilidad.indicadores',
    'funcion:observabilidad.ventana',
    'funcion:observabilidad.restaurante',
    'funcion:observabilidad.ver-tabla',
    'funcion:observabilidad.rutas-ordenar',
    'funcion:observabilidad.ruta-a-peticiones',
    'funcion:observabilidad.pausar',
    'funcion:observabilidad.actualizar',
  )
  await abrirComoPlataforma(page, plataforma, OBS)
  await expect(page.getByRole('heading', { name: 'Observabilidad', level: 1 })).toBeVisible()
  const indicadores = page.getByRole('region', { name: 'Indicadores de la ventana' })
  for (const nombre of ['Peticiones', 'Tasa de error', 'p95', 'p99', 'Tiempo medio de base']) {
    await expect(indicadores.getByText(nombre, { exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: /^24 h/u })).toHaveAttribute('aria-pressed', 'true')
  await evidencia(page, 'pla-16-panel')

  // Ventana de 1 hora: queda en la dirección y marcada.
  await page.getByRole('button', { name: /^1 h/u }).click()
  await expect(page).toHaveURL(/ventana=1h/u)
  await expect(page.getByRole('button', { name: /^1 h/u })).toHaveAttribute('aria-pressed', 'true')

  // Solo el restaurante de esta prueba: sus peticiones son las del alta y la carga de datos.
  await page.getByRole('combobox', { name: 'Restaurante', exact: true }).selectOption(String(local.id))
  await expect(page).toHaveURL(new RegExp(`restaurante=${String(local.id)}`, 'u'))
  await expect(indicadores).not.toHaveAttribute('aria-busy', 'true')

  // Cada gráfico tiene su vista de tabla.
  const trafico = tarjeta(page, 'Tráfico')
  await trafico.getByRole('button', { name: 'Ver tabla' }).click()
  await expect(trafico.getByRole('columnheader', { name: 'Cubo' })).toBeVisible()
  await trafico.getByRole('button', { name: 'Ver gráfico' }).click()
  await expect(trafico.getByRole('columnheader', { name: 'Cubo' })).toBeHidden()

  // Las rutas se ordenan en el servidor por la columna elegida.
  const rutas = tarjeta(page, 'Rutas')
  const porP95 = page.waitForResponse((r) => r.url().includes('/observability/routes') && r.url().includes('sort=p95'))
  await rutas.getByRole('button', { name: /^p95/u }).click()
  await porP95
  await expect(rutas.getByRole('columnheader', { name: /p95/u })).toHaveAttribute('aria-sort', 'descending')
  await evidencia(page, 'pla-16-rutas-por-p95')

  // Una ruta lleva a sus peticiones, filtradas por su plantilla.
  const primera = rutas.getByRole('link', { name: /^Ver peticiones de /u }).first()
  const nombre = (await primera.getAttribute('aria-label')) ?? ''
  const plantilla = nombre.replace(/^Ver peticiones de \S+ /u, '')
  await primera.click()
  await expect(page).toHaveURL(/ruta=/u)
  await expect(page.getByLabel('Ruta (plantilla)')).toHaveValue(plantilla)

  // Pausar detiene la actualización; «Actualizar ahora» relee el panel.
  await page.getByRole('button', { name: 'Pausar' }).click()
  await expect(page.getByRole('button', { name: 'Reanudar' })).toBeVisible()
  const relectura = page.waitForResponse((r) => r.url().includes('/observability/summary'))
  await page.getByRole('button', { name: 'Actualizar ahora' }).click()
  await relectura
  await page.getByRole('button', { name: 'Reanudar' }).click()
  await expect(page.getByRole('button', { name: 'Pausar' })).toBeVisible()
})

test('PLA-17 los logs y las peticiones se filtran, se paginan y se enlazan por request_id', async ({ page, plataforma }) => {
  cubre(
    'funcion:observabilidad.logs-filtrar',
    'funcion:observabilidad.logs-detalle',
    'funcion:observabilidad.logs-cargar-mas',
    'funcion:observabilidad.peticiones-filtrar',
    'funcion:observabilidad.peticiones-cargar-mas',
    'funcion:observabilidad.peticion-a-logs',
    'desplegable:platform/observability/ExpandButton',
    'estado:observabilidad.vacio',
  )
  await asegurarLogs(plataforma)
  await abrirComoPlataforma(page, plataforma, OBS)

  const logs = tarjeta(page, 'Logs')
  await expect(logs.getByText(/^50 entradas; hay más$/u)).toBeVisible()
  await logs.getByRole('button', { name: 'Cargar más' }).click()
  await expect(logs.getByText(/^\d+ entradas/u)).not.toHaveText(/^50 entradas/u)

  // Filtro por nivel y por texto.
  await logs.getByLabel('Nivel').selectOption('warning')
  await logs.getByLabel('Buscar en el evento y sus campos').fill('auth.login_failed')
  const filtrados = page.waitForResponse((r) => r.url().includes('/observability/logs?') && r.url().includes('search=auth.login_failed'))
  await logs.getByRole('button', { name: 'Buscar' }).click()
  await filtrados
  await expect(page).toHaveURL(/nivel=warning/u)
  await expect(page).toHaveURL(/buscar=auth\.login_failed/u)
  await expect(logs.getByRole('cell', { name: 'auth.login_failed' }).first()).toBeVisible()

  // El detalle muestra el logger y los campos, y lleva a las peticiones de ese request_id.
  await logs.getByRole('button', { name: 'Ver detalle' }).first().click()
  await expect(logs.getByText('Logger:')).toBeVisible()
  await evidencia(page, 'pla-17-detalle-log')
  await logs.getByRole('button', { name: 'Ocultar' }).click()
  await expect(logs.getByText('Logger:')).toBeHidden()

  // Un texto que no aparece deja la tabla vacía; «Quitar filtros» la devuelve.
  await logs.getByLabel('Buscar en el evento y sus campos').fill(`nada-${unico()}`)
  await logs.getByRole('button', { name: 'Buscar' }).click()
  await expect(logs.getByText('No hay logs con esos filtros en esta ventana.')).toBeVisible()
  await logs.getByRole('button', { name: 'Quitar filtros' }).click()
  await expect(logs.getByText('No hay logs con esos filtros en esta ventana.')).toBeHidden()

  // Peticiones: paginación, filtro por estado y el enlace a sus logs.
  const peticiones = tarjeta(page, 'Peticiones')
  await expect(peticiones.getByText(/^50 peticiones; hay más$/u)).toBeVisible()
  await peticiones.getByRole('button', { name: 'Cargar más' }).click()
  await expect(peticiones.getByText(/^100 peticiones/u)).toBeVisible()
  // El estado se aplica al elegirlo, sin «Buscar».
  await peticiones.getByLabel('Estado').selectOption({ label: '4xx y 5xx' })
  await expect(page).toHaveURL(/estado=400/u)
  // Quedan solo respuestas 4xx o 5xx de cualquier prueba (401, 404, 409, 422…).
  await expect(peticiones.getByRole('cell', { name: /^[45]\d{2}$/u }).first()).toBeVisible()
  await expect(peticiones.getByRole('cell', { name: /^2\d{2}$/u })).toHaveCount(0)
  await evidencia(page, 'pla-17-peticiones-4xx')

  const aLogs = peticiones.getByRole('link', { name: /^Ver los logs de /u }).first()
  const requestId = ((await aLogs.getAttribute('aria-label')) ?? '').replace('Ver los logs de ', '')
  await aLogs.click()
  await expect(page).toHaveURL(new RegExp(`log_peticion=${requestId}`, 'u'))
  await expect(logs.getByLabel('request_id')).toHaveValue(requestId)

  await peticiones.getByLabel('request_id').fill(`no-existe-${unico()}`)
  await peticiones.getByRole('button', { name: 'Buscar' }).click()
  await expect(peticiones.getByText('No hay peticiones con esos filtros en esta ventana.')).toBeVisible()
})

test('PLA-18 si una lectura del panel falla, la sección lo dice y «Reintentar» la vuelve a pedir', async ({
  page,
  plataforma,
}) => {
  cubre('estado:observabilidad.error')
  let fallar = true
  await page.route('**/api/v1/platform/observability/summary**', async (ruta) => {
    if (fallar) {
      await ruta.fulfill({ status: 500, contentType: 'application/json', body: '{"detail":"error"}' })
      return
    }
    await ruta.fallback()
  })
  await abrirComoPlataforma(page, plataforma, OBS)
  const reintentar = page.getByRole('button', { name: 'Reintentar' }).first()
  await expect(reintentar).toBeVisible()
  await evidencia(page, 'pla-18-error')
  fallar = false
  await reintentar.click()
  await expect(page.getByRole('region', { name: 'Indicadores de la ventana' }).getByText('Tasa de error')).toBeVisible()
})
