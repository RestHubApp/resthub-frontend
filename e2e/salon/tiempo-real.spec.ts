// HU11, HU30, HU12, HU22: la cocina ve el pedido en cuanto el mesero lo envía,
// sin recargar; lo marca listo y el celular del mesero cambia solo. Las notas
// con alergia se resaltan para quien ve el panel (regla por palabras clave).
import type { Browser, Page } from '@playwright/test'

import type { Session } from '../soporte/api'
import { covers } from '../soporte/cobertura'
import { openAs, notice, evidence, expect, test } from '../soporte/fixtures'
import { api, orderInTable } from '../soporte/salon'

/** Otro navegador (otra tablet, otra laptop) con su propia sesión. */
async function otherBrowser(browser: Browser, session: Session, destination: string): Promise<Page> {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    locale: 'es-PE',
    timezoneId: 'America/Lima',
    serviceWorkers: 'block',
    viewport: { width: 1366, height: 900 },
  })
  const page = await context.newPage()
  await openAs(page, session, destination)
  return page
}

/** Deja una marca en la ventana: si la página se recarga, la marca se pierde. */
async function markWithoutReload(page: Page): Promise<void> {
  await page.evaluate(() => {
    ;(window as unknown as { sinRecargar: boolean }).sinRecargar = true
  })
}

async function noSeSurcharge(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as unknown as { sinRecargar?: boolean }).sinRecargar === true)
}

// eslint-disable-next-line security/detect-non-literal-regexp -- patrón armado con datos fijos de la propia prueba, sin entradas de usuarios
const column = (page: Page, status: string) => page.getByRole('region', { name: new RegExp(`^${status}: \\d+$`, 'u') })

test('SAL-06 la cocina ve el pedido sin recargar, lo marca listo y el mesero lo sirve @movil', async ({ page, browser, local }) => {
  // Dos navegadores y el recorrido completo de un pedido: tarda el doble que
  // una prueba de una sola pantalla.
  test.slow()
  covers(
    'ruta:/tablero',
    'ruta:/pedidos/:orderId',
    'funcion:tablero.tiempo-real',
    'funcion:tablero.marcar-listo',
    'funcion:pedidos.en-vivo',
    'funcion:pedido.marcar-servido',
  )
  // La cocina (rol Cocinero) ya tiene el tablero abierto en su pantalla.
  const kitchen = await otherBrowser(browser, local.cocina, '/tablero')
  await expect(kitchen.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await expect(column(kitchen, 'En cocina')).toContainText('Sin pedidos')
  await markWithoutReload(kitchen)

  await openAs(page, local.mesero, '/pedidos')
  await expect(page.getByRole('status').filter({ hasText: 'En vivo' })).toBeVisible()
  await page.getByRole('link', { name: /Mesa 1.*Libre/u }).click()
  await page.getByRole('button', { name: /^Lomo saltado/u }).click()
  await page.getByRole('button', { name: 'Enviar a cocina' }).click()
  await expect(notice(page, 'Pedido #1 enviado a cocina.')).toBeVisible()
  await evidence(page, 'sal-06-1-mesero-envia')

  // Aparece en el tablero de la cocina sin que nadie recargue.
  const card = column(kitchen, 'En cocina').getByRole('article', { name: 'Pedido #1' })
  await expect(card).toBeVisible()
  await expect(card).toContainText('Mesa 1')
  await expect(card).toContainText('1×Lomo saltado')
  await expect(card).toContainText('Nuevo')
  expect(await noSeSurcharge(kitchen)).toBe(true)
  // El Cocinero marca listo pero no cobra.
  await expect(kitchen.getByRole('button', { name: 'Cobrar' })).toHaveCount(0)
  await evidence(kitchen, 'sal-06-2-tablero-cocina')

  await markWithoutReload(page)
  await card.getByRole('button', { name: 'Marcar listo' }).click()
  await expect(column(kitchen, 'Listo').getByRole('article', { name: 'Pedido #1' })).toBeVisible()

  // El celular del mesero cambia solo.
  const table = page.getByRole('link', { name: /Mesa 1/u })
  await expect(table).toContainText('Listo')
  await expect(table).toContainText('Falta servirlo')
  expect(await noSeSurcharge(page)).toBe(true)
  await evidence(page, 'sal-06-3-mesero-ve-listo')

  await table.click()
  await page.getByRole('button', { name: 'Marcar servido' }).click()
  await expect(notice(page, 'Pedido #1 servido, por cobrar.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cobrar' })).toBeVisible()
  await expect(column(kitchen, 'Servido, por cobrar').getByRole('article', { name: 'Pedido #1' })).toBeVisible()
  expect(await noSeSurcharge(kitchen)).toBe(true)
  await evidence(kitchen, 'sal-06-4-servido')
  await kitchen.context().close()
})

test('SAL-07 la pantalla de cocina muestra lo que falta preparar sin precios y el encargado lo marca listo', async ({
  page,
  local,
}) => {
  covers('ruta:/cocina', 'funcion:cocina.por-preparar', 'funcion:cocina.marcar-listo', 'estado:cocina.vacio')
  await openAs(page, local.encargado, '/cocina')
  await expect(page.getByText('Nada pendiente en cocina')).toBeVisible()
  await expect(page.getByText('Nada esperando a salir')).toBeVisible()
  await evidence(page, 'sal-07-1-vacia')

  // Llegan dos pedidos mientras la pantalla está abierta.
  await orderInTable(local, local.mesa('2'), [{ plato: local.plato('Ceviche clásico'), cantidad: 2, notas: 'Sin ají' }])
  await orderInTable(local, local.mesa('3'), [{ plato: local.plato('Inca Kola 500 ml') }])
  const first = page.getByRole('article', { name: 'Pedido 1' })
  await expect(first).toBeVisible()
  await expect(page.getByRole('article', { name: 'Pedido 2' })).toBeVisible()
  await expect(page.getByText('Por preparar (2)')).toBeVisible()
  await expect(first).toContainText('2×Ceviche clásico')
  await expect(first).toContainText('Sin ají')
  await expect(first).not.toContainText('S/')
  await evidence(page, 'sal-07-2-por-preparar')

  await first.getByRole('button', { name: 'Listo' }).click()
  await expect(notice(page, 'Pedido #1 listo.')).toBeVisible()
  await expect(page.getByText('Por preparar (1)')).toBeVisible()
  await expect(page.getByText('Listos para servir (1)')).toBeVisible()
  await expect(page.getByRole('article', { name: 'Pedido 1' }).getByRole('button', { name: 'Listo' })).toHaveCount(0)
  const active = await api(local).lista('/orders/active')
  expect(active.map((p) => [p.number, p.status])).toEqual([
    [1, 'ready'],
    [2, 'in_kitchen'],
  ])
})

test('SAL-08 el mesero ve la cocina sin poder marcar listo @movil', async ({ page, local }) => {
  covers('funcion:cocina.solo-mirar')
  await orderInTable(local, local.mesa('1'), [{ plato: local.plato('Lomo saltado') }])
  await openAs(page, local.mesero, '/cocina')
  const card = page.getByRole('article', { name: 'Pedido 1' })
  await expect(card).toContainText('1×Lomo saltado')
  await expect(card.getByRole('button', { name: 'Listo' })).toHaveCount(0)
  await evidence(page, 'sal-08-1-mesero-cocina')
})

test('SAL-09 una nota con alergia se resalta en el tablero, la cocina y el detalle', async ({ page, local }) => {
  covers('funcion:tablero.alergia-resaltada', 'funcion:pedido.alergia-resaltada')
  const withAllergy = await orderInTable(local, local.mesa('1'), [
    { plato: local.plato('Ají de gallina'), notas: 'Es alérgica al maní' },
    { plato: local.plato('Chicha morada'), notas: 'Sin hielo' },
  ])
  await orderInTable(local, local.mesa('2'), [{ plato: local.plato('Lomo saltado'), notas: 'Sin cebolla' }])

  await openAs(page, local.encargado, '/tablero')
  const allergic = page.getByRole('article', { name: 'Pedido #1' })
  await expect(allergic.getByText('Con alergia')).toBeVisible()
  await expect(allergic.getByText('Alergia', { exact: true })).toBeVisible()
  await expect(allergic.getByText('Alergia', { exact: true })).toHaveAttribute('title', /Según las reglas/u)
  await expect(allergic).toContainText('Es alérgica al maní')
  // «Sin cebolla» o «Sin hielo» son preferencias: se resaltan como nota, sin el distintivo.
  const other = page.getByRole('article', { name: 'Pedido #2' })
  await expect(other).toContainText('Sin cebolla')
  await expect(other.getByText('Con alergia')).toHaveCount(0)
  await evidence(page, 'sal-09-1-tablero-alergia')

  await page.goto('/cocina')
  await expect(page.getByRole('article', { name: 'Pedido 1' }).getByText('Con alergia')).toBeVisible()
  await expect(page.getByRole('article', { name: 'Pedido 2' }).getByText('Con alergia')).toHaveCount(0)

  await page.goto(`/pedidos/${String(withAllergy.id)}`)
  await expect(page.getByRole('heading', { level: 1, name: 'Pedido #1' })).toBeVisible()
  await expect(page.getByText('Con alergia')).toBeVisible()
  await evidence(page, 'sal-09-2-detalle-alergia')

  // La nota original no se modifica.
  const order = await api(local).get(`/orders/${String(withAllergy.id)}`)
  expect((order.items as { notes: string }[])[0].notes).toBe('Es alérgica al maní')
})
