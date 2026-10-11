// Regresión visual de las mesas, el personal y los roles del local, con sus
// ventanas y confirmaciones.
import type { Locator, Page } from '@playwright/test'

import { api } from '../soporte/gestion'
import { covers } from '../soporte/cobertura'
import { openAs } from '../soporte/fixtures'
import { capture, captureWindow, expect, deadline, test } from './captura'
import { inKitchen } from './preparar'

interface WindowValue {
  readonly boton: Locator
  readonly rol: 'dialog' | 'alertdialog'
  readonly titulo: string
  readonly nombre: string
}

/** Abre un formulario en ventana, lo captura y lo cierra con Escape. */
async function form(page: Page, button: Locator, title: string, name: string): Promise<void> {
  await button.click()
  const open = page.getByRole('dialog', { name: title, exact: true })
  await captureWindow(open, name)
  await page.keyboard.press('Escape')
  await expect(open).toBeHidden()
}

/** Abre una ventana, la captura y la cancela. */
async function handleWindow(page: Page, { boton: button, rol: role, titulo: title, nombre: name }: WindowValue): Promise<void> {
  await button.click()
  const open = page.getByRole(role, { name: title })
  await captureWindow(open, name)
  await open.getByRole('button', { name: 'Cancelar' }).click()
  await expect(open).toBeHidden()
}

test('VIS-10 las mesas, el personal y los roles con sus ventanas', async ({ page, local }) => {
  deadline(120_000)
  covers(
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
  await inKitchen(local, local.mesa('2'), [{ plato: local.plato('Lomo saltado') }])
  // Un rol sin cuentas: el que tiene cuentas no se puede eliminar.
  await api(local).post('/roles', { name: 'Cajero', permissions: ['orders.read_all', 'cash.manage'] })

  await openAs(page, local.encargado, '/mesas')
  await expect(page.getByText('4 activas de 4')).toBeVisible()
  await expect(page.getByText(/Ocupada · pedido #1/u)).toBeVisible()
  await capture(page, 'mesas')
  await form(page, page.getByRole('button', { name: 'Nueva mesa' }), 'Nueva mesa', 'dialogo-nueva-mesa')
  const table1 = page.getByRole('listitem').filter({ hasText: 'Mesa 1' })
  await form(page, table1.getByRole('button', { name: 'Renombrar' }), 'Renombrar Mesa 1', 'dialogo-renombrar-mesa')

  await page.goto('/personal')
  const waiter = page.getByRole('row', { name: /Mesero Prueba/u })
  await expect(waiter).toContainText('mesero@e2e.resthub.dev')
  await capture(page, 'personal')
  await handleWindow(page, { boton: page.getByRole('button', { name: 'Nueva cuenta' }), rol: 'dialog', titulo: 'Nueva cuenta', nombre: 'dialogo-nueva-cuenta' })
  await handleWindow(page, { boton: waiter.getByRole('button', { name: 'Editar' }), rol: 'dialog', titulo: 'Editar a Mesero Prueba', nombre: 'dialogo-editar-cuenta' })
  await handleWindow(page, { boton: waiter.getByRole('button', { name: 'Contraseña' }), rol: 'dialog', titulo: 'Restablecer la contraseña de Mesero Prueba', nombre: 'dialogo-restablecer-contrasena' })
  await handleWindow(page, { boton: waiter.getByRole('button', { name: 'Desactivar' }), rol: 'alertdialog', titulo: '¿Desactivar a Mesero Prueba?', nombre: 'confirmar-desactivar-cuenta' })

  await page.goto('/roles')
  await expect(page.getByRole('heading', { level: 1, name: 'Roles' })).toBeVisible()
  await expect(page.getByText('Cajero').first()).toBeVisible()
  await capture(page, 'roles')
  await form(page, page.getByRole('button', { name: 'Nuevo rol' }), 'Nuevo rol', 'dialogo-nuevo-rol')
  const owner = page.getByRole('listitem').filter({ hasText: /^Encargado/u })
  await form(page, owner.getByRole('button', { name: 'Ver permisos' }), 'Encargado', 'dialogo-ver-permisos-rol')
  const cashier = page.getByRole('listitem').filter({ hasText: /^Cajero/u })
  await form(page, cashier.getByRole('button', { name: 'Editar' }), 'Editar Cajero', 'dialogo-editar-rol')
  await handleWindow(page, { boton: page.getByRole('button', { name: 'Eliminar el rol Cajero' }), rol: 'alertdialog', titulo: '¿Eliminar el rol Cajero?', nombre: 'confirmar-eliminar-rol' })
})
