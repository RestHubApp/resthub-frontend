// Regresión visual del área de plataforma y de la vista previa.
//
// La lista de restaurantes, la bitácora, el local de muestra y la
// observabilidad muestran lo que hacen todas las pruebas a la vez: reciben
// datos fijos (`data.ts`, ver `capture.ts`). El detalle del restaurante es
// el de esta prueba.
import type { APIRequestContext, Page } from '@playwright/test'

import type { PlatformSandbox, PreviewCodeResponse } from '../../src/api/types'
import { Customer } from '../support/api'
import { withSampleRestaurant } from '../support/platform'
import { covers } from '../support/coverage'
import { openAsPlatform } from '../support/fixtures'
import { capture, captureWindow, expect, deadline, test, captureTime } from './capture'
import { orderInQueue } from './prepare'

test('VIS-13 restaurantes, alta, detalle, bitácora, observabilidad y vista previa de plataforma', async ({
  page,
  platform,
  local,
}) => {
  deadline(150_000)
  covers(
    'ruta:/plataforma',
    'ruta:/plataforma/restaurantes/nuevo',
    'ruta:/plataforma/restaurantes/:restaurantId',
    'dialogo:platform/OwnersSection',
    'confirmacion:platform/RestaurantStatusButton',
    'ruta:/plataforma/bitacora',
    'ruta:/plataforma/observabilidad',
    'ruta:/plataforma/vista-previa',
    'confirmacion:platform/SandboxResetButton',
  )
  await openAsPlatform(page, platform, '/plataforma/no-existe')
  await expect(page).toHaveURL(/\/plataforma$/u)
  await expect(page.getByRole('heading', { name: '3 restaurantes' })).toBeVisible()
  await capture(page, 'plataforma-restaurantes')

  await page.getByRole('link', { name: 'Nuevo restaurante' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo restaurante' })).toBeVisible()
  await capture(page, 'plataforma-nuevo-restaurante')

  await page.goto(`/plataforma/restaurantes/${String(local.id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Restaurante E2E' })).toBeVisible()
  await expect(page.getByText('encargado@e2e.resthub.dev')).toBeVisible()
  await capture(page, 'plataforma-restaurante')

  await page.getByRole('button', { name: 'Agregar encargado' }).click()
  const owner = page.getByRole('dialog', { name: 'Agregar encargado' })
  await captureWindow(owner, 'dialogo-agregar-encargado')
  await page.keyboard.press('Escape')
  await expect(owner).toBeHidden()

  await page.getByRole('button', { name: 'Desactivar restaurante' }).click()
  const deactivate = page.getByRole('alertdialog', { name: '¿Desactivar Restaurante E2E?' })
  await captureWindow(deactivate, 'confirmar-desactivar-restaurante')
  await deactivate.getByRole('button', { name: 'Cancelar' }).click()
  await expect(deactivate).toBeHidden()

  await page.getByRole('link', { name: 'Bitácora' }).click()
  await expect(page.getByText('4 en total')).toBeVisible()
  await capture(page, 'plataforma-bitacora')

  await page.getByRole('link', { name: 'Observabilidad' }).click()
  // La sección de rutas no pide datos hasta entrar en pantalla (el observador
  // la carga sola con 250 px de margen): se desplaza hasta su marcador en un
  // solo paso, en vez de tocar el botón, que el propio observador puede
  // desprender del DOM a medio clic (la pestaña de scroll-y-clic quedaba
  // esperando un botón que ya no estaba).
  // Con el armazón único la pantalla ancha monta algunas secciones sola: se baja
  // por la página hasta que el observador las haya cargado todas.
  await page.mouse.move(700, 500)
  await expect(async () => {
    await page.mouse.wheel(0, 700)
    await expect(page.getByText('5 peticiones', { exact: true })).toBeVisible({ timeout: 1_000 })
  }).toPass()
  await expect(page.getByRole('heading', { name: 'Rutas' })).toBeVisible()
  await expect(page.getByText('orders.open_failed')).toBeVisible()
  await expect(page.getByText('5 peticiones', { exact: true })).toBeVisible()
  // La barra lateral es fija: la captura parte siempre de arriba, no de donde dejó el desplazamiento.
  await page.evaluate(() => { window.scrollTo(0, 0) })
  await capture(page, 'plataforma-observabilidad')

  await page.getByRole('link', { name: 'Vista previa' }).click()
  await expect(page.getByText('muestra-local')).toBeVisible()
  await capture(page, 'plataforma-vista-previa')
  await page.getByRole('button', { name: 'Reiniciar local de muestra' }).click()
  const reset = page.getByRole('alertdialog', { name: '¿Reiniciar el local de muestra?' })
  await captureWindow(reset, 'confirmar-reiniciar-local-de-muestra')
  await reset.getByRole('button', { name: 'Cancelar' }).click()
  await expect(reset).toBeHidden()
})

/** Un código de vista previa recién pedido, con el local de muestra creado si no existía. */
async function previewCode(http: APIRequestContext, token: string): Promise<string> {
  const admin = new Customer(http, token)
  const sample = await admin.get<PlatformSandbox>('/platform/sandbox').catch(() => null)
  if (sample?.restaurant === null || sample?.restaurant === undefined) {
    await admin.post('/platform/sandbox/reset')
  }
  return (await admin.post<PreviewCodeResponse>('/platform/preview', { as: 'waiter' })).code
}

async function previewSession(page: Page): Promise<{ userId: number; restaurantId: number }> {
  return page.evaluate(() => {
    const raw = sessionStorage.getItem('resthub.vista-previa.sesion.v1') ?? '{}'
    const { account } = JSON.parse(raw) as { account: { user: { id: number }; restaurant: { id: number } } }
    return { userId: account.user.id, restaurantId: account.restaurant.id }
  })
}

test('VIS-14 la franja de la vista previa como mesero, su salida con pedidos sin enviar y el código vencido', async ({
  page,
  platform,
  request,
}) => {
  deadline(240_000)
  covers('ruta:/vista-previa', 'confirmacion:shell/PreviewExitButton')

  await page.goto('/vista-previa#codigo=codigo-que-no-existe')
  await expect(page.getByRole('heading', { name: 'No se pudo abrir la vista previa' })).toBeVisible()
  await capture(page, 'vista-previa-codigo-invalido')

  await withSampleRestaurant(async () => {
    const code = await previewCode(request, platform.token)
    // Solo cambia el fragmento: sin salir antes de la página, el código no se vuelve a canjear.
    await page.goto('about:blank')
    await page.goto(`/vista-previa#codigo=${encodeURIComponent(code)}`)
    const slot = page.getByRole('region', { name: 'Vista previa' })
    await expect(slot).toContainText('Vista previa · Restaurante de muestra · como Mesero')
    await expect(page).toHaveURL(/\/pedidos$/u)
    // Los datos del local de muestra los cambian otras pruebas: se captura la franja y el armazón.
    await expect(slot).toHaveScreenshot('vista-previa-franja.png', { mask: [slot.getByRole('timer')], timeout: captureTime })
    await capture(page, 'vista-previa-mesero', { mask: [page.getByRole('main')] })

    await orderInQueue(page, {
      owner: await previewSession(page),
      table: { id: 0, label: '3' },
      dish: { id: 0 },
      storage: 'sessionStorage',
    })
    await slot.getByRole('button', { name: 'Salir de la vista previa' }).click()
    const signOut = page.getByRole('alertdialog', { name: '¿Salir con pedidos sin enviar?' })
    await expect(signOut).toContainText('Mesa 3')
    await captureWindow(signOut, 'confirmar-salir-de-la-vista-previa')
    await signOut.getByRole('button', { name: 'Cancelar' }).click()
    await expect(signOut).toBeHidden()

    // La sesión de la vista previa no tiene permisos de plataforma: la guarda la lleva al inicio.
    await page.goto('/plataforma')
    await expect(page).toHaveURL(/\/pedidos$/u)
  })
})
