// Regresión visual de las mesas, el personal y los roles del local, con sus
// ventanas y confirmaciones.
import type { Locator, Page } from '@playwright/test'

import { api } from '../soporte/gestion'
import { cubre } from '../soporte/cobertura'
import { abrirComo } from '../soporte/fixtures'
import { capturar, capturarVentana, expect, plazo, test } from './captura'
import { enCocina } from './preparar'

interface Ventana {
  readonly boton: Locator
  readonly rol: 'dialog' | 'alertdialog'
  readonly titulo: string
  readonly nombre: string
}

/** Abre un formulario en ventana, lo captura y lo cierra con Escape. */
async function formulario(page: Page, boton: Locator, titulo: string, nombre: string): Promise<void> {
  await boton.click()
  const abierta = page.getByRole('dialog', { name: titulo, exact: true })
  await capturarVentana(abierta, nombre)
  await page.keyboard.press('Escape')
  await expect(abierta).toBeHidden()
}

/** Abre una ventana, la captura y la cancela. */
async function ventana(page: Page, { boton, rol, titulo, nombre }: Ventana): Promise<void> {
  await boton.click()
  const abierta = page.getByRole(rol, { name: titulo })
  await capturarVentana(abierta, nombre)
  await abierta.getByRole('button', { name: 'Cancelar' }).click()
  await expect(abierta).toBeHidden()
}

test('VIS-10 las mesas, el personal y los roles con sus ventanas', async ({ page, local }) => {
  plazo(120_000)
  cubre(
    'ruta:/mesas',
    'dialogo:tables/TableFormDialog',
    'ruta:/personal',
    'dialogo:staff/StaffView',
    'dialogo:staff/StaffRowActions#1',
    'dialogo:staff/StaffRowActions#2',
    'confirmacion:staff/StaffStatusButton',
    'ruta:/roles',
    'confirmacion:roles/DeleteRoleButton',
    'dialogo:roles/RoleFormDialog',
  )
  await enCocina(local, local.mesa('2'), [{ plato: local.plato('Lomo saltado') }])
  // Un rol sin cuentas: el que tiene cuentas no se puede eliminar.
  await api(local).post('/roles', { name: 'Cajero', permissions: ['orders.read_all', 'cash.manage'] })

  await abrirComo(page, local.encargado, '/mesas')
  await expect(page.getByText('4 activas de 4')).toBeVisible()
  await expect(page.getByText(/Ocupada · pedido #1/u)).toBeVisible()
  await capturar(page, 'mesas')
  await formulario(page, page.getByRole('button', { name: 'Nueva mesa' }), 'Nueva mesa', 'dialogo-nueva-mesa')
  const mesa1 = page.getByRole('listitem').filter({ hasText: 'Mesa 1' })
  await formulario(page, mesa1.getByRole('button', { name: 'Renombrar' }), 'Renombrar Mesa 1', 'dialogo-renombrar-mesa')

  await page.goto('/personal')
  const mesero = page.getByRole('row', { name: /Mesero Prueba/u })
  await expect(mesero).toContainText('mesero@e2e.resthub.dev')
  await capturar(page, 'personal')
  await ventana(page, { boton: page.getByRole('button', { name: 'Nueva cuenta' }), rol: 'dialog', titulo: 'Nueva cuenta', nombre: 'dialogo-nueva-cuenta' })
  await ventana(page, { boton: mesero.getByRole('button', { name: 'Editar' }), rol: 'dialog', titulo: 'Editar a Mesero Prueba', nombre: 'dialogo-editar-cuenta' })
  await ventana(page, { boton: mesero.getByRole('button', { name: 'Contraseña' }), rol: 'dialog', titulo: 'Restablecer la contraseña de Mesero Prueba', nombre: 'dialogo-restablecer-contrasena' })
  await ventana(page, { boton: mesero.getByRole('button', { name: 'Desactivar' }), rol: 'alertdialog', titulo: '¿Desactivar a Mesero Prueba?', nombre: 'confirmar-desactivar-cuenta' })

  await page.goto('/roles')
  await expect(page.getByRole('heading', { level: 1, name: 'Roles' })).toBeVisible()
  await expect(page.getByText('Cajero').first()).toBeVisible()
  await capturar(page, 'roles')
  await formulario(page, page.getByRole('button', { name: 'Nuevo rol' }), 'Nuevo rol', 'dialogo-nuevo-rol')
  const encargado = page.getByRole('listitem').filter({ hasText: /^Encargado/u })
  await formulario(page, encargado.getByRole('button', { name: 'Ver permisos' }), 'Encargado', 'dialogo-ver-permisos-rol')
  const cajero = page.getByRole('listitem').filter({ hasText: /^Cajero/u })
  await formulario(page, cajero.getByRole('button', { name: 'Editar' }), 'Editar Cajero', 'dialogo-editar-rol')
  await ventana(page, { boton: page.getByRole('button', { name: 'Eliminar el rol Cajero' }), rol: 'alertdialog', titulo: '¿Eliminar el rol Cajero?', nombre: 'confirmar-eliminar-rol' })
})
