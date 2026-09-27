// Regresión visual del área de plataforma y de la vista previa.
//
// La lista de restaurantes, la bitácora, el local de muestra y la
// observabilidad muestran lo que hacen todas las pruebas a la vez: reciben
// datos fijos (`datos.ts`, ver `captura.ts`). El detalle del restaurante es
// el de esta prueba.
import type { APIRequestContext, Page } from '@playwright/test'

import { Cliente } from '../soporte/api'
import { conLocalDeMuestra } from '../soporte/plataforma'
import { cubre } from '../soporte/cobertura'
import { abrirComoPlataforma } from '../soporte/fixtures'
import { capturar, capturarVentana, expect, plazo, test, tiempoDeCaptura } from './captura'
import { pedidoEnCola } from './preparar'

test('VIS-13 restaurantes, alta, detalle, bitácora, observabilidad y vista previa de plataforma', async ({
  page,
  plataforma,
  local,
}) => {
  plazo(150_000)
  cubre(
    'ruta:/plataforma',
    'ruta:/plataforma/*',
    'ruta:/plataforma/restaurantes/nuevo',
    'ruta:/plataforma/restaurantes/:restaurantId',
    'dialogo:platform/OwnersSection',
    'confirmacion:platform/RestaurantStatusButton',
    'ruta:/plataforma/bitacora',
    'ruta:/plataforma/observabilidad',
    'ruta:/plataforma/vista-previa',
    'confirmacion:platform/SandboxResetButton',
  )
  await abrirComoPlataforma(page, plataforma, '/plataforma/no-existe')
  await expect(page).toHaveURL(/\/plataforma$/u)
  await expect(page.getByRole('heading', { name: '3 restaurantes' })).toBeVisible()
  await capturar(page, 'plataforma-restaurantes')

  await page.getByRole('link', { name: 'Nuevo restaurante' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Nuevo restaurante' })).toBeVisible()
  await capturar(page, 'plataforma-nuevo-restaurante')

  await page.goto(`/plataforma/restaurantes/${String(local.id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Restaurante E2E' })).toBeVisible()
  await expect(page.getByText('encargado@e2e.resthub.dev')).toBeVisible()
  await capturar(page, 'plataforma-restaurante')

  await page.getByRole('button', { name: 'Agregar encargado' }).click()
  const encargado = page.getByRole('dialog', { name: 'Agregar encargado' })
  await capturarVentana(encargado, 'dialogo-agregar-encargado')
  await page.keyboard.press('Escape')
  await expect(encargado).toBeHidden()

  await page.getByRole('button', { name: 'Desactivar restaurante' }).click()
  const desactivar = page.getByRole('alertdialog', { name: '¿Desactivar Restaurante E2E?' })
  await capturarVentana(desactivar, 'confirmar-desactivar-restaurante')
  await desactivar.getByRole('button', { name: 'Cancelar' }).click()
  await expect(desactivar).toBeHidden()

  await page.getByRole('link', { name: 'Bitácora' }).click()
  await expect(page.getByText('4 en total')).toBeVisible()
  await capturar(page, 'plataforma-bitacora')

  await page.getByRole('link', { name: 'Observabilidad' }).click()
  await expect(page.getByRole('heading', { name: 'Rutas' })).toBeVisible()
  await expect(page.getByText('orders.open_failed')).toBeVisible()
  await capturar(page, 'plataforma-observabilidad')

  await page.getByRole('link', { name: 'Vista previa' }).click()
  await expect(page.getByText('muestra-local')).toBeVisible()
  await capturar(page, 'plataforma-vista-previa')
  await page.getByRole('button', { name: 'Reiniciar local de muestra' }).click()
  const reiniciar = page.getByRole('alertdialog', { name: '¿Reiniciar el local de muestra?' })
  await capturarVentana(reiniciar, 'confirmar-reiniciar-local-de-muestra')
  await reiniciar.getByRole('button', { name: 'Cancelar' }).click()
  await expect(reiniciar).toBeHidden()
})

/** Un código de vista previa recién pedido, con el local de muestra creado si no existía. */
async function codigoDeVistaPrevia(http: APIRequestContext, token: string): Promise<string> {
  const admin = new Cliente(http, token)
  const muestra = await admin.get('/platform/sandbox').catch(() => null)
  if (muestra?.restaurant === null || muestra?.restaurant === undefined) {
    await admin.post('/platform/sandbox/reset')
  }
  return String((await admin.post('/platform/preview', { as: 'waiter' })).code)
}

async function sesionDeVistaPrevia(page: Page): Promise<{ userId: number; restaurantId: number }> {
  return page.evaluate(() => {
    const crudo = sessionStorage.getItem('resthub.vista-previa.sesion.v1') ?? '{}'
    const { account } = JSON.parse(crudo) as { account: { user: { id: number }; restaurant: { id: number } } }
    return { userId: account.user.id, restaurantId: account.restaurant.id }
  })
}

test('VIS-14 la franja de la vista previa como mesero, su salida con pedidos sin enviar y el código vencido', async ({
  page,
  plataforma,
  request,
}) => {
  plazo(240_000)
  cubre('ruta:/vista-previa', 'confirmacion:shell/PreviewExitButton')

  await page.goto('/vista-previa#codigo=codigo-que-no-existe')
  await expect(page.getByRole('heading', { name: 'No se pudo abrir la vista previa' })).toBeVisible()
  await capturar(page, 'vista-previa-codigo-invalido')

  await conLocalDeMuestra(async () => {
    const codigo = await codigoDeVistaPrevia(request, plataforma.token)
    // Solo cambia el fragmento: sin salir antes de la página, el código no se vuelve a canjear.
    await page.goto('about:blank')
    await page.goto(`/vista-previa#codigo=${encodeURIComponent(codigo)}`)
    const franja = page.getByRole('region', { name: 'Vista previa' })
    await expect(franja).toContainText('Vista previa · Restaurante de muestra · como Mesero')
    await expect(page).toHaveURL(/\/pedidos$/u)
    // Los datos del local de muestra los cambian otras pruebas: se captura la franja y el armazón.
    await expect(franja).toHaveScreenshot('vista-previa-franja.png', { mask: [franja.getByRole('timer')], timeout: tiempoDeCaptura })
    await capturar(page, 'vista-previa-mesero', { mask: [page.getByRole('main')] })

    await pedidoEnCola(page, {
      dueno: await sesionDeVistaPrevia(page),
      mesa: { id: 0, etiqueta: '3' },
      plato: { id: 0 },
      almacen: 'sessionStorage',
    })
    await franja.getByRole('button', { name: 'Salir de la vista previa' }).click()
    const salir = page.getByRole('alertdialog', { name: '¿Salir con pedidos sin enviar?' })
    await expect(salir).toContainText('Mesa 3')
    await capturarVentana(salir, 'confirmar-salir-de-la-vista-previa')
    await salir.getByRole('button', { name: 'Cancelar' }).click()
    await expect(salir).toBeHidden()

    await page.goto('/plataforma')
    await expect(page.getByText('Estás en una vista previa')).toBeVisible()
    await capturar(page, 'vista-previa-plataforma-bloqueada', { mask: [page.getByRole('region', { name: 'Vista previa' })] })
  })
})
