// Regresión visual de la cuenta del mesero: su perfil, el panel «Más» del
// celular y el aviso al cerrar sesión con un pedido que espera señal.
import { cubre } from '../soporte/cobertura'
import { abrirComo } from '../soporte/fixtures'
import { capturar, capturarVentana, esMovil, expect, plazo, test } from './captura'
import { duenoDe, pedidoEnCola } from './preparar'

test('VIS-12 el perfil, el panel de la cuenta y el aviso de pedidos sin enviar al salir', async ({ page, local }) => {
  plazo(90_000)
  cubre('ruta:/perfil', 'hoja:shell/MoreSheet', 'confirmacion:shell/SessionActions')

  await abrirComo(page, local.mesero, '/perfil')
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
  await expect(page.getByText('mesero@e2e.resthub.dev')).toBeVisible()
  await capturar(page, 'perfil')

  await pedidoEnCola(page, { dueno: duenoDe(local.mesero), mesa: local.mesa('3'), plato: local.plato('Lomo saltado') })
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()

  if (esMovil()) {
    // En el celular la cuenta vive en el último botón de la barra inferior.
    await page.getByRole('button', { name: /^(?:Más|Cuenta)$/u }).click()
    const hoja = page.getByRole('dialog', { name: /^(?:Más|Cuenta)$/u })
    await capturarVentana(hoja, 'hoja-mas')
    await hoja.getByRole('button', { name: 'Cerrar sesión' }).click()
  } else {
    await page.getByRole('button', { name: 'Cerrar sesión' }).click()
  }
  const aviso = page.getByRole('alertdialog', { name: '¿Cerrar sesión con pedidos sin enviar?' })
  await expect(aviso).toContainText('Mesa 3')
  await capturarVentana(aviso, 'confirmar-cerrar-sesion')
  await aviso.getByRole('button', { name: 'Cancelar' }).click()
  await expect(aviso).toBeHidden()
  // La sesión sigue abierta: en el celular se vuelve a la hoja, en escritorio al perfil.
  const vuelta = esMovil()
    ? page.getByRole('dialog', { name: /^(?:Más|Cuenta)$/u })
    : page.getByRole('heading', { level: 1, name: 'Mi perfil' })
  await expect(vuelta).toBeVisible()
})
