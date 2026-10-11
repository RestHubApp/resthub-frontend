// Regresión visual de la cuenta del mesero: su perfil, el panel «Más» del
// celular y el aviso al cerrar sesión con un pedido que espera señal.
import { covers } from '../soporte/cobertura'
import { openAs } from '../soporte/fixtures'
import { capture, captureWindow, esMovil, expect, deadline, test } from './captura'
import { ownerOf, orderInQueue } from './preparar'

test('VIS-12 el perfil, el panel de la cuenta y el aviso de pedidos sin enviar al salir', async ({ page, local }) => {
  deadline(90_000)
  covers('ruta:/perfil', 'hoja:shell/MoreSheet', 'confirmacion:shell/SessionActions')

  await openAs(page, local.waiter, '/perfil')
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
  await expect(page.getByText('mesero@e2e.resthub.dev')).toBeVisible()
  await capture(page, 'perfil')

  await orderInQueue(page, { owner: ownerOf(local.waiter), table: local.table('3'), dish: local.dish('Lomo saltado') })
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()

  if (esMovil()) {
    // En el celular la cuenta vive en el último botón de la barra inferior.
    await page.getByRole('button', { name: /^(?:Más|Cuenta)$/u }).click()
    const sheet = page.getByRole('dialog', { name: /^(?:Más|Cuenta)$/u })
    await captureWindow(sheet, 'hoja-mas')
    await sheet.getByRole('button', { name: 'Cerrar sesión' }).click()
  } else {
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }
  const notice = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(notice).toContainText('Mesa 3')
  await captureWindow(notice, 'confirmar-cerrar-sesion')
  await notice.getByRole('button', { name: 'Cancelar' }).click()
  await expect(notice).toBeHidden()
  // La sesión sigue abierta: en el celular se vuelve a la hoja, en escritorio al perfil.
  const round = esMovil()
    ? page.getByRole('dialog', { name: /^(?:Más|Cuenta)$/u })
    : page.getByRole('heading', { level: 1, name: 'Mi perfil' })
  await expect(round).toBeVisible()
})
