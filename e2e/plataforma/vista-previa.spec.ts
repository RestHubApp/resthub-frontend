// «Vista previa» (HU41): el administrador del sistema ve RestHub como el
// encargado o el mesero del local de muestra, en una pestaña nueva con su
// franja, y el canje del código de un solo uso.
//
// El local de muestra es uno solo en el backend entero: cada prueba que lo usa
// toma el candado de `conLocalDeMuestra` y pide su código justo antes de usarlo.
import type { BrowserContext, Locator, Page } from '@playwright/test'

import { covers } from '../soporte/cobertura'
import { openAsPlatform, evidence, expect, test } from '../soporte/fixtures'
import { withSampleRestaurant, enqueueOrders, navigation, sections, withoutOrdersSending } from '../soporte/plataforma'

// Esperar el candado se suma al tiempo de la prueba.
test.describe.configure({ timeout: 180_000 })

const SLOT = 'Vista previa'
const SIGN_OUT = 'Salir de la vista previa'
// El alto de la franja en el celular, con el texto en su propia línea.
const SLOT_MAX_PX = 160

/**
 * Toca un botón que cierra la pestaña de vista previa y espera el cierre.
 *
 * `click()` no termina al despachar el toque: después confirma la acción con
 * la página, y si la pestaña ya se cerró (`window.close()` en el manejador)
 * falla con «Target page, context or browser has been closed» aunque la
 * aplicación hizo lo correcto. En el celular emulado el toque tarda un poco
 * más y la carrera se perdía a veces (PLA-13 en el CI). Se comprueba que el
 * botón está a la vista y habilitado, se despacha el clic dentro de la
 * página (la evaluación responde antes de la tarea que cierra la pestaña) y
 * se espera el evento `close`.
 */
async function touchAndWaitClosing(page: Page, button: Locator): Promise<void> {
  await expect(button).toBeVisible()
  await expect(button).toBeEnabled()
  const closed = page.waitForEvent('close')
  await button.dispatchEvent('click')
  await closed
}

/** Pulsa «Ver como …» y devuelve la pestaña nueva que abre. */
async function viewAs(page: Page, context: BrowserContext, as: 'encargado' | 'mesero'): Promise<Page> {
  const fresh = context.waitForEvent('page')
  await page.getByRole('button', { name: `Ver como ${as}` }).click()
  const tab = await fresh
  await expect(tab.getByRole('region', { name: SLOT })).toBeVisible({ timeout: 15_000 })
  return tab
}

test('PLA-11 reiniciar el local de muestra lo archiva y crea otro', async ({ page, plataforma: platform }) => {
  covers('confirmacion:platform/SandboxResetButton', 'funcion:plataforma.vista-previa.reiniciar', 'ruta:/plataforma/vista-previa')
  await withSampleRestaurant(async () => {
    await openAsPlatform(page, platform, '/plataforma/vista-previa')
    await expect(page.getByRole('heading', { name: 'Vista previa', level: 1 })).toBeVisible()
    const reset = page.getByRole('button', { name: 'Reiniciar local de muestra' })
    const confirmation = page.getByRole('alertdialog', { name: '¿Reiniciar el local de muestra?' })
    await reset.click()
    await confirmation.getByRole('button', { name: 'Cancelar' }).click()
    await expect(confirmation).toBeHidden()
    await expect(page.getByText('Listo: el local de muestra empieza de nuevo.')).toBeHidden()

    const response = page.waitForResponse((r) => r.url().endsWith('/platform/sandbox/reset') && r.ok())
    await reset.click()
    await evidence(page, 'pla-11-confirmar')
    await confirmation.getByRole('button', { name: 'Reiniciar' }).click()
    const sample = (await (await response).json()) as { restaurant: { slug: string } }
    await expect(page.getByText('Listo: el local de muestra empieza de nuevo.')).toBeVisible()
    await expect(page.getByText(sample.restaurant.slug)).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Mesero de muestra' })).toContainText('Mesero')
    await evidence(page, 'pla-11-reiniciado')
  })
})

test('PLA-12 la vista previa como encargado abre otra pestaña con su franja y todas las secciones', async ({ page, plataforma: platform, context }) => {
  covers(
    'funcion:plataforma.vista-previa.como-encargado',
    'rol:vista-previa-encargado',
    'ruta:/vista-previa',
    'funcion:vista-previa.canjear',
    'funcion:vista-previa.sin-cerrar-sesion',
    'funcion:vista-previa.plataforma-bloqueada',
    'funcion:vista-previa.salir',
  )
  await withSampleRestaurant(async () => {
    await openAsPlatform(page, platform, '/plataforma/vista-previa')
    const preview = await viewAs(page, context, 'encargado')
    await expect(page.getByText('Se abrió la vista previa como encargado en otra pestaña.')).toBeVisible()
    await expect(preview).toHaveURL(/\/pedidos$/u)
    const slot = preview.getByRole('region', { name: SLOT })
    await expect(slot).toContainText('Vista previa · Restaurante de muestra · como Encargado')
    await expect(slot.getByRole('timer')).toHaveText(/\d{1,2}:\d{2}/u)
    await expect.poll(() => sections(preview)).toContain('Panel BI')
    expect(await sections(preview)).toHaveLength(13)
    // En la vista previa se sale desde la franja, no con «Cerrar sesión».
    await expect(navigation(preview).locator('xpath=..').getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0)
    await expect(preview.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0)
    await evidence(preview, 'pla-12-encargado')
    await preview.goto('/perfil')
    await expect(preview.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible()
    await expect(preview.getByRole('heading', { name: 'Cambiar contraseña' })).toHaveCount(0)
    // La pestaña de vista previa no abre la administración del sistema.
    await preview.goto('/plataforma')
    await expect(preview.getByText('Estás en una vista previa')).toBeVisible()
    await evidence(preview, 'pla-12-plataforma-bloqueada')
    await touchAndWaitClosing(preview, preview.getByRole('button', { name: SIGN_OUT }))
    // La sesión de plataforma de esta pestaña sigue intacta.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Vista previa', level: 1 })).toBeVisible()
  })
})

test('PLA-13 la vista previa como mesero muestra su franja y avisa antes de descartar pedidos sin enviar @movil', async ({ page, plataforma: platform, context }) => {
  covers(
    'funcion:plataforma.vista-previa.como-mesero',
    'rol:vista-previa-mesero',
    'confirmacion:shell/PreviewExitButton',
    'funcion:vista-previa.salir-con-pendientes',
    'funcion:vista-previa.canjear',
  )
  await withSampleRestaurant(async () => {
    await openAsPlatform(page, platform, '/plataforma/vista-previa')
    const preview = await viewAs(page, context, 'mesero')
    await expect(preview).toHaveURL(/\/pedidos$/u)
    const slot = preview.getByRole('region', { name: SLOT })
    await expect(slot).toContainText('Vista previa · Restaurante de muestra · como Mesero')
    await expect.poll(() => sections(preview)).toEqual(['Pedidos', 'Cocina', 'Reservas', 'Clientes'])
    if (test.info().project.name === 'movil') {
      const cashRegister = await slot.boundingBox()
      expect(cashRegister?.height ?? Infinity).toBeLessThan(SLOT_MAX_PX)
    }
    await evidence(preview, 'pla-13-mesero')

    // Un pedido del local de muestra quedó en la cola de esta pestaña.
    const account = await preview.evaluate(() => {
      const raw = sessionStorage.getItem('resthub.vista-previa.sesion.v1') ?? '{}'
      const { account } = JSON.parse(raw) as { account: { user: { id: number }; restaurant: { id: number } } }
      return { userId: account.user.id, restaurantId: account.restaurant.id }
    })
    await withoutOrdersSending(preview)
    await enqueueOrders(preview, account, [{ mesa: { id: 1, etiqueta: '5' }, plato: { id: 1 } }], 'pestana')
    await preview.reload()
    await preview.getByRole('button', { name: SIGN_OUT }).click()
    const notice = preview.getByRole('alertdialog', { name: '¿Salir con pedidos sin enviar?' })
    await expect(notice).toContainText('Un pedido del local de muestra espera señal: Mesa 5')
    await evidence(preview, 'pla-13-aviso-pendientes')
    await notice.getByRole('button', { name: 'Cancelar' }).click()
    await expect(notice).toBeHidden()
    await expect(slot).toBeVisible()
    await preview.getByRole('button', { name: SIGN_OUT }).click()
    await touchAndWaitClosing(preview, notice.getByRole('button', { name: 'Salir y descartarlos' }))
  })
})

test('PLA-14 el enlace de repuesto abre la vista previa si el navegador bloqueó la pestaña, y sirve una sola vez', async ({ page, plataforma: platform, context }) => {
  covers(
    'funcion:plataforma.vista-previa.enlace-de-repuesto',
    'estado:vista-previa.codigo-invalido',
    'funcion:vista-previa.volver-a-plataforma',
    'funcion:vista-previa.canjear',
  )
  await withSampleRestaurant(async () => {
    // El navegador «bloquea» la pestaña nueva: queda solo el enlace del aviso.
    await page.addInitScript(() => {
      window.open = () => null
    })
    await openAsPlatform(page, platform, '/plataforma/vista-previa')
    await page.getByRole('button', { name: 'Ver como encargado' }).click()
    const link = page.getByRole('link', { name: 'Abrir la vista previa como encargado' })
    await expect(link).toBeVisible()
    const address = await link.getAttribute('href')
    expect(address).toMatch(/\/vista-previa#codigo=/u)
    await evidence(page, 'pla-14-enlace')
    const fresh = context.waitForEvent('page')
    await link.click()
    const preview = await fresh
    await expect(preview.getByRole('region', { name: SLOT })).toContainText('como Encargado', { timeout: 15_000 })
    await expect(link).toBeHidden()
    await preview.close()

    // El mismo código otra vez: ya se usó.
    const other = await context.newPage()
    await other.goto(address ?? '/vista-previa')
    await expect(other.getByRole('heading', { name: 'No se pudo abrir la vista previa' })).toBeVisible()
    await expect(other.getByRole('alert').filter({ hasText: 'El código de vista previa no vale: venció (dura un minuto) o ya se usó.' })).toBeVisible()
    await evidence(other, 'pla-14-codigo-usado')
    await other.getByRole('link', { name: 'Volver a la administración del sistema' }).click()
    await expect(other).toHaveURL(/\/plataforma\/vista-previa$/u)
    await expect(other.getByRole('heading', { name: 'Vista previa', level: 1 })).toBeVisible()
  })
})

test('PLA-15 el canje avisa si falta el código, si no vale o si no hay conexión, y la pestaña sin sesión no ofrece el acceso', async ({ page }) => {
  covers('estado:vista-previa.sin-codigo', 'estado:vista-previa.codigo-invalido', 'estado:vista-previa.sin-conexion', 'estado:vista-previa.terminada', 'ruta:/vista-previa')
  const title = page.getByRole('heading', { name: 'No se pudo abrir la vista previa' })
  await page.goto('/vista-previa')
  await expect(title).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'Esta dirección no trae un código de vista previa.' })).toBeVisible()

  // Cambiar solo el fragmento no recarga la página: se sale antes para que
  // cada código se canjee en una carga nueva, como al abrir el enlace.
  await page.goto('about:blank')
  await page.goto('/vista-previa#codigo=un-codigo-que-no-existe')
  await expect(page.getByRole('alert').filter({ hasText: 'El código de vista previa no vale: venció (dura un minuto) o ya se usó.' })).toBeVisible()
  // El código sale de la barra de direcciones.
  await expect(page).toHaveURL(/\/vista-previa$/u)
  await evidence(page, 'pla-15-invalido')

  await page.route('**/api/v1/auth/preview', (route) => route.abort('internetdisconnected'))
  await page.goto('about:blank')
  await page.goto('/vista-previa#codigo=otro-codigo')
  await expect(page.getByRole('alert').filter({ hasText: 'No hubo conexión con el servidor para abrir la vista previa.' })).toBeVisible()

  // Un canje fallido no abre sesión ni marca la pestaña: fuera de
  // /vista-previa vuelve a ser una pestaña normal, con el acceso.
  await page.goto('/pedidos')
  await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()

  // Una pestaña marcada como de vista previa (se marca al abrir la sesión)
  // cuya sesión ya no está no ofrece el acceso normal.
  await page.evaluate(() => {
    sessionStorage.setItem('resthub.vista-previa.pestana.v1', '1')
  })
  await page.goto('/pedidos')
  await expect(page.getByText('Saliste de la vista previa')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar' })).toHaveCount(0)
  await evidence(page, 'pla-15-terminada')
  await page.getByRole('button', { name: 'Cerrar la vista previa' }).click()
  // Una pestaña que no abrió un script no se deja cerrar: vuelve a la administración.
  await expect(page).toHaveURL(/\/plataforma\/(acceso|vista-previa)$/u)
})
