// HU11, HU30, HU12, HU22: la cocina ve el pedido en cuanto el mesero lo envía,
// sin recargar; lo marca listo y el celular del mesero cambia solo. Las notas
// con alergia se resaltan para quien ve el panel (regla por palabras clave).
import type { Browser, Page } from '@playwright/test'

import type { Sesion } from '../soporte/api'
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, pedidoEnMesa } from '../soporte/salon'

/** Otro navegador (otra tablet, otra laptop) con su propia sesión. */
async function otroNavegador(browser: Browser, sesion: Sesion, destino: string): Promise<Page> {
  const contexto = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    serviceWorkers: 'block',
    viewport: { width: 1366, height: 900 },
  })
  const pagina = await contexto.newPage()
  await abrirComo(pagina, sesion, destino)
  return pagina
}

/** Deja una marca en la ventana: si la página se recarga, la marca se pierde. */
async function marcarSinRecarga(page: Page): Promise<void> {
  await page.evaluate(() => {
    ;(window as unknown as { sinRecargar: boolean }).sinRecargar = true
  })
}

async function noSeRecargo(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { sinRecargar?: boolean }).sinRecargar === true)
}

// eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
const columna = (page: Page, estado: string) => page.getByRole('region', { name: new RegExp(`^${estado}: \\d+$`, 'u') })

test('SAL-06 la cocina ve el pedido sin recargar, lo marca listo y el mesero lo sirve @movil', async ({ page, browser, local }) => {
  // Dos navegadores y el recorrido completo de un pedido: tarda el doble que
  // una prueba de una sola pantalla.
  test.slow()
  cubre(
    'ruta:/tablero',
    'ruta:/pedidos/:orderId',
    'funcion:tablero.tiempo-real',
    'funcion:tablero.marcar-listo',
    'funcion:pedidos.en-vivo',
    'funcion:pedido.marcar-servido',
  )
  // La cocina (rol Cocinero) ya tiene el tablero abierto en su pantalla.
  const cocina = await otroNavegador(browser, local.cocina, '/tablero')
  await expect(cocina.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await expect(columna(cocina, 'En cocina')).toContainText('Sin pedidos')
  await marcarSinRecarga(cocina)

  await abrirComo(page, local.mesero, '/pedidos')
  await expect(page.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await page.getByRole('link', { name: /Mesa 1.*Libre/u }).click()
  await page.getByRole('button', { name: /^Lomo saltado/u }).click()
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(aviso(page, 'Pedido #1 enviado a cocina.')).toBeVisible()
  await evidencia(page, 'sal-06-1-mesero-envia')

  // Aparece en el tablero de la cocina sin que nadie recargue.
  const tarjeta = columna(cocina, 'En cocina').getByRole('article', { name: 'Pedido #1' })
  await expect(tarjeta).toBeVisible()
  await expect(tarjeta).toContainText('Mesa 1')
  await expect(tarjeta).toContainText('1×Lomo saltado')
  await expect(tarjeta).toContainText('Nuevo')
  expect(await noSeRecargo(cocina)).toBe(true)
  // El Cocinero marca listo pero no cobra.
  await expect(cocina.getByRole('button', { name: 'Cobrar' })).toHaveCount(0)
  await evidencia(cocina, 'sal-06-2-tablero-cocina')

  await marcarSinRecarga(page)
  await tarjeta.getByRole('button', { name: 'Marcar listo' }).click()
  await expect(columna(cocina, 'Listo').getByRole('article', { name: 'Pedido #1' })).toBeVisible()

  // El celular del mesero cambia solo.
  const mesa = page.getByRole('link', { name: /Mesa 1/u })
  await expect(mesa).toContainText('Listo')
  await expect(mesa).toContainText('Falta servirlo')
  expect(await noSeRecargo(page)).toBe(true)
  await evidencia(page, 'sal-06-3-mesero-ve-listo')

  await mesa.click()
  await page.getByRole('button', { name: 'Marcar servido' }).click()
  await expect(aviso(page, 'Pedido #1 servido, por cobrar.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cobrar' })).toBeVisible()
  await expect(columna(cocina, 'Servido, por cobrar').getByRole('article', { name: 'Pedido #1' })).toBeVisible()
  expect(await noSeRecargo(cocina)).toBe(true)
  await evidencia(cocina, 'sal-06-4-servido')
  await cocina.context().close()
})

test('SAL-07 la pantalla de cocina muestra lo que falta preparar sin precios y el encargado lo marca listo', async ({
  page,
  local,
}) => {
  cubre('ruta:/cocina', 'funcion:cocina.por-preparar', 'funcion:cocina.marcar-listo', 'estado:cocina.vacio')
  await abrirComo(page, local.encargado, '/cocina')
  await expect(page.getByText('Nada pendiente en cocina')).toBeVisible()
  await expect(page.getByText('Nada esperando a salir')).toBeVisible()
  await evidencia(page, 'sal-07-1-vacia')

  // Llegan dos pedidos mientras la pantalla está abierta.
  await pedidoEnMesa(local, local.mesa('2'), [{ plato: local.plato('Ceviche clásico'), cantidad: 2, notas: 'Sin ají' }])
  await pedidoEnMesa(local, local.mesa('3'), [{ plato: local.plato('Inca Kola 500 ml') }])
  const primero = page.getByRole('article', { name: 'Pedido 1' })
  await expect(primero).toBeVisible()
  await expect(page.getByRole('article', { name: 'Pedido 2' })).toBeVisible()
  await expect(page.getByText('Por preparar (2)')).toBeVisible()
  await expect(primero).toContainText('2×Ceviche clásico')
  await expect(primero).toContainText('Sin ají')
  await expect(primero).not.toContainText('S/')
  await evidencia(page, 'sal-07-2-por-preparar')

  await primero.getByRole('button', { name: 'Listo' }).click()
  await expect(aviso(page, 'Pedido #1 listo.')).toBeVisible()
  await expect(page.getByText('Por preparar (1)')).toBeVisible()
  await expect(page.getByText('Listos para servir (1)')).toBeVisible()
  await expect(page.getByRole('article', { name: 'Pedido 1' }).getByRole('button', { name: 'Listo' })).toHaveCount(0)
  const activos = await api(local).lista('/orders/active')
  expect(activos.map((p) => [p.number, p.status])).toEqual([
    [1, 'ready'],
    [2, 'in_kitchen'],
  ])
})

test('SAL-08 el mesero ve la cocina sin poder marcar listo @movil', async ({ page, local }) => {
  cubre('funcion:cocina.solo-mirar')
  await pedidoEnMesa(local, local.mesa('1'), [{ plato: local.plato('Lomo saltado') }])
  await abrirComo(page, local.mesero, '/cocina')
  const tarjeta = page.getByRole('article', { name: 'Pedido 1' })
  await expect(tarjeta).toContainText('1×Lomo saltado')
  await expect(tarjeta.getByRole('button', { name: 'Listo' })).toHaveCount(0)
  await evidencia(page, 'sal-08-1-mesero-cocina')
})

test('SAL-09 una nota con alergia se resalta en el tablero, la cocina y el detalle', async ({ page, local }) => {
  cubre('funcion:tablero.alergia-resaltada', 'funcion:pedido.alergia-resaltada')
  const conAlergia = await pedidoEnMesa(local, local.mesa('1'), [
    { plato: local.plato('Ají de gallina'), notas: 'Es alérgica al maní' },
    { plato: local.plato('Chicha morada'), notas: 'Sin hielo' },
  ])
  await pedidoEnMesa(local, local.mesa('2'), [{ plato: local.plato('Lomo saltado'), notas: 'Sin cebolla' }])

  await abrirComo(page, local.encargado, '/tablero')
  const alergica = page.getByRole('article', { name: 'Pedido #1' })
  await expect(alergica.getByText('Con alergia')).toBeVisible()
  await expect(alergica.getByText('Alergia', { exact: true })).toBeVisible()
  await expect(alergica.getByText('Alergia', { exact: true })).toHaveAttribute('title', /Según las reglas/u)
  await expect(alergica).toContainText('Es alérgica al maní')
  // «Sin cebolla» o «Sin hielo» son preferencias: se resaltan como nota, sin el distintivo.
  const otra = page.getByRole('article', { name: 'Pedido #2' })
  await expect(otra).toContainText('Sin cebolla')
  await expect(otra.getByText('Con alergia')).toHaveCount(0)
  await evidencia(page, 'sal-09-1-tablero-alergia')

  await page.goto('/cocina')
  await expect(page.getByRole('article', { name: 'Pedido 1' }).getByText('Con alergia')).toBeVisible()
  await expect(page.getByRole('article', { name: 'Pedido 2' }).getByText('Con alergia')).toHaveCount(0)

  await page.goto(`/pedidos/${String(conAlergia.id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await expect(page.getByText('Con alergia')).toBeVisible()
  await evidencia(page, 'sal-09-2-detalle-alergia')

  // La nota original no se modifica.
  const pedido = await api(local).get(`/orders/${String(conAlergia.id)}`)
  expect((pedido.items as { notes: string }[])[0].notes).toBe('Es alérgica al maní')
})
