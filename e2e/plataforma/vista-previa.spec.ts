// «Vista previa» (HU41): el administrador del sistema ve RestHub como el
// encargado o el mesero del local de muestra, en una pestaña nueva con su
// franja, y el canje del código de un solo uso.
//
// El local de muestra es uno solo en el backend entero: cada prueba que lo usa
// toma el candado de `conLocalDeMuestra` y pide su código justo antes de usarlo.
import type { BrowserContext, Page } from '@playwright/test'

import { cubre } from '../soporte/cobertura'
import { abrirComoPlataforma, evidencia, expect, test } from '../soporte/fixtures'
import { conLocalDeMuestra, encolarPedidos, navegacion, secciones, sinEnvioDePedidos } from '../soporte/plataforma'

// Esperar el candado se suma al tiempo de la prueba.
test.describe.configure({ timeout: 180_000 })

const FRANJA = 'Vista previa'
const SALIR = 'Salir de la vista previa'
// El alto de la franja en el celular, con el texto en su propia línea.
const FRANJA_MAXIMA_PX = 160

/** Pulsa «Ver como …» y devuelve la pestaña nueva que abre. */
async function verComo(page: Page, context: BrowserContext, como: 'encargado' | 'mesero'): Promise<Page> {
  const nueva = context.waitForEvent('page')
  await page.getByRole('button', { name: `Ver como ${como}` }).click()
  const pestana = await nueva
  await expect(pestana.getByRole('region', { name: FRANJA })).toBeVisible({ timeout: 15_000 })
  return pestana
}

test('PLA-11 reiniciar el local de muestra lo archiva y crea otro', async ({ page, plataforma }) => {
  cubre('confirmacion:platform/SandboxResetButton', 'funcion:plataforma.vista-previa.reiniciar', 'ruta:/plataforma/vista-previa')
  await conLocalDeMuestra(async () => {
    await abrirComoPlataforma(page, plataforma, '/plataforma/vista-previa')
    await expect(page.getByRole('heading', { name: 'Vista previa', level: 1 })).toBeVisible()
    const reiniciar = page.getByRole('button', { name: 'Reiniciar local de muestra' })
    const confirmacion = page.getByRole('alertdialog', { name: '¿Reiniciar el local de muestra?' })
    await reiniciar.click()
    await confirmacion.getByRole('button', { name: 'Cancelar' }).click()
    await expect(confirmacion).toBeHidden()
    await expect(page.getByText('Listo: el local de muestra empieza de nuevo.')).toBeHidden()

    const respuesta = page.waitForResponse((r) => r.url().endsWith('/platform/sandbox/reset') && r.ok())
    await reiniciar.click()
    await evidencia(page, 'pla-11-confirmar')
    await confirmacion.getByRole('button', { name: 'Reiniciar' }).click()
    const muestra = (await (await respuesta).json()) as { restaurant: { slug: string } }
    await expect(page.getByText('Listo: el local de muestra empieza de nuevo.')).toBeVisible()
    await expect(page.getByText(muestra.restaurant.slug)).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: 'Mesero de muestra' })).toContainText('Mesero')
    await evidencia(page, 'pla-11-reiniciado')
  })
})

test('PLA-12 la vista previa como encargado abre otra pestaña con su franja y todas las secciones', async ({ page, plataforma, context }) => {
  cubre(
    'funcion:plataforma.vista-previa.como-encargado',
    'rol:vista-previa-encargado',
    'ruta:/vista-previa',
    'funcion:vista-previa.canjear',
    'funcion:vista-previa.sin-cerrar-sesion',
    'funcion:vista-previa.plataforma-bloqueada',
    'funcion:vista-previa.salir',
  )
  await conLocalDeMuestra(async () => {
    await abrirComoPlataforma(page, plataforma, '/plataforma/vista-previa')
    const previa = await verComo(page, context, 'encargado')
    await expect(page.getByText('Se abrió la vista previa como encargado en otra pestaña.')).toBeVisible()
    await expect(previa).toHaveURL(/\/pedidos$/u)
    const franja = previa.getByRole('region', { name: FRANJA })
    await expect(franja).toContainText('Vista previa · Restaurante de muestra · como Encargado')
    await expect(franja.getByRole('timer')).toHaveText(/\d{1,2}:\d{2}/u)
    await expect.poll(() => secciones(previa)).toContain('Panel BI')
    expect(await secciones(previa)).toHaveLength(13)
    // En la vista previa se sale desde la franja, no con «Cerrar sesión».
    await expect(navegacion(previa).locator('xpath=..').getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0)
    await expect(previa.getByRole('button', { name: 'Cerrar sesión' })).toHaveCount(0)
    await evidencia(previa, 'pla-12-encargado')
    await previa.goto('/perfil')
    await expect(previa.getByRole('heading', { name: 'Mi perfil', level: 1 })).toBeVisible()
    await expect(previa.getByRole('heading', { name: 'Cambiar contraseña' })).toHaveCount(0)
    // La pestaña de vista previa no abre la administración del sistema.
    await previa.goto('/plataforma')
    await expect(previa.getByText('Estás en una vista previa')).toBeVisible()
    await evidencia(previa, 'pla-12-plataforma-bloqueada')
    const cerrada = previa.waitForEvent('close')
    await previa.getByRole('button', { name: SALIR }).click()
    await cerrada
    // La sesión de plataforma de esta pestaña sigue intacta.
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Vista previa', level: 1 })).toBeVisible()
  })
})

test('PLA-13 la vista previa como mesero muestra su franja y avisa antes de descartar pedidos sin enviar @movil', async ({ page, plataforma, context }) => {
  cubre(
    'funcion:plataforma.vista-previa.como-mesero',
    'rol:vista-previa-mesero',
    'confirmacion:shell/PreviewExitButton',
    'funcion:vista-previa.salir-con-pendientes',
    'funcion:vista-previa.canjear',
  )
  await conLocalDeMuestra(async () => {
    await abrirComoPlataforma(page, plataforma, '/plataforma/vista-previa')
    const previa = await verComo(page, context, 'mesero')
    await expect(previa).toHaveURL(/\/pedidos$/u)
    const franja = previa.getByRole('region', { name: FRANJA })
    await expect(franja).toContainText('Vista previa · Restaurante de muestra · como Mesero')
    await expect.poll(() => secciones(previa)).toEqual(['Pedidos', 'Cocina', 'Reservas', 'Clientes'])
    if (test.info().project.name === 'movil') {
      const caja = await franja.boundingBox()
      expect(caja?.height ?? Infinity).toBeLessThan(FRANJA_MAXIMA_PX)
    }
    await evidencia(previa, 'pla-13-mesero')

    // Un pedido del local de muestra quedó en la cola de esta pestaña.
    const cuenta = await previa.evaluate(() => {
      const crudo = sessionStorage.getItem('resthub.vista-previa.sesion.v1') ?? '{}'
      const { account } = JSON.parse(crudo) as { account: { user: { id: number }; restaurant: { id: number } } }
      return { userId: account.user.id, restaurantId: account.restaurant.id }
    })
    await sinEnvioDePedidos(previa)
    await encolarPedidos(previa, cuenta, [{ mesa: { id: 1, etiqueta: '5' }, plato: { id: 1 } }], 'pestana')
    await previa.reload()
    await previa.getByRole('button', { name: SALIR }).click()
    const aviso = previa.getByRole('alertdialog', { name: '¿Salir con pedidos sin enviar?' })
    await expect(aviso).toContainText('Un pedido del local de muestra espera señal: Mesa 5')
    await evidencia(previa, 'pla-13-aviso-pendientes')
    await aviso.getByRole('button', { name: 'Cancelar' }).click()
    await expect(aviso).toBeHidden()
    await expect(franja).toBeVisible()
    const cerrada = previa.waitForEvent('close')
    await previa.getByRole('button', { name: SALIR }).click()
    await aviso.getByRole('button', { name: 'Salir y descartarlos' }).click()
    await cerrada
  })
})

test('PLA-14 el enlace de repuesto abre la vista previa si el navegador bloqueó la pestaña, y sirve una sola vez', async ({ page, plataforma, context }) => {
  cubre(
    'funcion:plataforma.vista-previa.enlace-de-repuesto',
    'estado:vista-previa.codigo-invalido',
    'funcion:vista-previa.volver-a-plataforma',
    'funcion:vista-previa.canjear',
  )
  await conLocalDeMuestra(async () => {
    // El navegador «bloquea» la pestaña nueva: queda solo el enlace del aviso.
    await page.addInitScript(() => {
      window.open = () => null
    })
    await abrirComoPlataforma(page, plataforma, '/plataforma/vista-previa')
    await page.getByRole('button', { name: 'Ver como encargado' }).click()
    const enlace = page.getByRole('link', { name: 'Abrir la vista previa como encargado' })
    await expect(enlace).toBeVisible()
    const direccion = await enlace.getAttribute('href')
    expect(direccion).toMatch(/\/vista-previa#codigo=/u)
    await evidencia(page, 'pla-14-enlace')
    const nueva = context.waitForEvent('page')
    await enlace.click()
    const previa = await nueva
    await expect(previa.getByRole('region', { name: FRANJA })).toContainText('como Encargado', { timeout: 15_000 })
    await expect(enlace).toBeHidden()
    await previa.close()

    // El mismo código otra vez: ya se usó.
    const otra = await context.newPage()
    await otra.goto(direccion ?? '/vista-previa')
    await expect(otra.getByRole('heading', { name: 'No se pudo abrir la vista previa' })).toBeVisible()
    await expect(otra.getByText('El código de vista previa no vale: venció (dura un minuto) o ya se usó.')).toBeVisible()
    await evidencia(otra, 'pla-14-codigo-usado')
    await otra.getByRole('link', { name: 'Volver a la administración del sistema' }).click()
    await expect(otra).toHaveURL(/\/plataforma\/vista-previa$/u)
    await expect(otra.getByRole('heading', { name: 'Vista previa', level: 1 })).toBeVisible()
  })
})

test('PLA-15 el canje avisa si falta el código, si no vale o si no hay conexión, y la pestaña sin sesión no ofrece el acceso', async ({ page }) => {
  cubre('estado:vista-previa.sin-codigo', 'estado:vista-previa.codigo-invalido', 'estado:vista-previa.sin-conexion', 'estado:vista-previa.terminada', 'ruta:/vista-previa')
  const titulo = page.getByRole('heading', { name: 'No se pudo abrir la vista previa' })
  await page.goto('/vista-previa')
  await expect(titulo).toBeVisible()
  await expect(page.getByText('Esta dirección no trae un código de vista previa.')).toBeVisible()

  // Cambiar solo el fragmento no recarga la página: se sale antes para que
  // cada código se canjee en una carga nueva, como al abrir el enlace.
  await page.goto('about:blank')
  await page.goto('/vista-previa#codigo=un-codigo-que-no-existe')
  await expect(page.getByText('El código de vista previa no vale: venció (dura un minuto) o ya se usó.')).toBeVisible()
  // El código sale de la barra de direcciones.
  await expect(page).toHaveURL(/\/vista-previa$/u)
  await evidencia(page, 'pla-15-invalido')

  await page.route('**/api/v1/auth/preview', (ruta) => ruta.abort('internetdisconnected'))
  await page.goto('about:blank')
  await page.goto('/vista-previa#codigo=otro-codigo')
  await expect(page.getByText('No hubo conexión con el servidor para abrir la vista previa.')).toBeVisible()

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
  await evidencia(page, 'pla-15-terminada')
  await page.getByRole('button', { name: 'Cerrar la vista previa' }).click()
  // Una pestaña que no abrió un script no se deja cerrar: vuelve a la administración.
  await expect(page).toHaveURL(/\/plataforma\/(acceso|vista-previa)$/u)
})
