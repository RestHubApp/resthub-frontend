// Regresión visual de las mesas, el personal y los roles del local, con sus
// ventanas y confirmaciones.
import type { Locator, Page } from '@playwright/test'

import { api } from '../support/management'
import { covers } from '../support/coverage'
import { openAs } from '../support/fixtures'
import { capture, captureWindow, expect, deadline, test } from './capture'
import { inKitchen } from './prepare'
import { staffSecurity } from './securityData'

interface WindowSpec {
  readonly button: Locator
  readonly role: 'dialog' | 'alertdialog'
  readonly title: string
  readonly name: string
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
async function checkWindow(page: Page, { button, role, title, name }: WindowSpec): Promise<void> {
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
    'dialogo:staff/StaffCreateDialog',
    'dialogo:staff/StaffRowDialogs#1',
    'dialogo:staff/StaffRowDialogs#2',
    'confirmacion:staff/StaffDeactivateConfirm',
    'ruta:/roles',
    'confirmacion:roles/DeleteRoleButton',
    'hoja:roles/RoleFormDialog',
  )
  await inKitchen(local, local.table('2'), [{ dish: local.dish('Lomo saltado') }])
  // Un rol sin cuentas: el que tiene cuentas no se puede eliminar.
  await api(local).post('/roles', { name: 'Cajero', permissions: ['orders.read_all', 'cash.manage'] })

  await openAs(page, local.owner, '/mesas')
  await expect(page.getByText('4 activas de 4')).toBeVisible()
  await expect(page.getByText(/Ocupada · pedido #1/u)).toBeVisible()
  await capture(page, 'mesas')
  await form(page, page.getByRole('button', { name: 'Nueva mesa' }), 'Nueva mesa', 'dialogo-nueva-mesa')
  const table1 = page.getByRole('listitem').filter({ hasText: 'Mesa 1' })
  await table1.getByRole('button', { name: 'Más acciones de Mesa 1' }).click()
  await form(page, page.getByRole('menu', { name: 'Más acciones de Mesa 1' }).getByRole('menuitem', { name: 'Renombrar' }), 'Renombrar Mesa 1', 'dialogo-renombrar-mesa')

  await staffSecurity(page)
  await page.goto('/personal')
  const waiter = page.getByRole('row', { name: /Mesero Prueba/u })
  await expect(waiter).toContainText('mesero@e2e.resthub.dev')
  await capture(page, 'personal')
  await checkWindow(page, { button: page.getByRole('button', { name: 'Nueva cuenta' }), role: 'dialog', title: 'Nueva cuenta', name: 'dialogo-nueva-cuenta' })
  await checkWindow(page, { button: waiter.getByRole('button', { name: 'Editar' }), role: 'dialog', title: 'Editar a Mesero Prueba', name: 'dialogo-editar-cuenta' })
  await waiter.getByRole('button', { name: 'Más acciones de Mesero Prueba' }).click()
  await checkWindow(page, { button: page.getByRole('menu', { name: 'Más acciones de Mesero Prueba' }).getByRole('menuitem', { name: 'Contraseña' }), role: 'dialog', title: 'Restablecer la contraseña de Mesero Prueba', name: 'dialogo-restablecer-contrasena' })
  await waiter.getByRole('button', { name: 'Más acciones de Mesero Prueba' }).click()
  await checkWindow(page, { button: page.getByRole('menu', { name: 'Más acciones de Mesero Prueba' }).getByRole('menuitem', { name: 'Desactivar' }), role: 'alertdialog', title: '¿Desactivar a Mesero Prueba?', name: 'confirmar-desactivar-cuenta' })

  await page.goto('/roles')
  await expect(page.getByRole('heading', { level: 1, name: 'Roles' })).toBeVisible()
  await expect(page.getByText('Cajero').first()).toBeVisible()
  await capture(page, 'roles')
  await form(page, page.getByRole('button', { name: 'Nuevo rol' }), 'Nuevo rol', 'dialogo-nuevo-rol')
  const owner = page.getByRole('listitem').filter({ hasText: /^Encargado/u })
  await form(page, owner.getByRole('button', { name: 'Ver permisos' }), 'Encargado', 'dialogo-ver-permisos-rol')
  const cashier = page.getByRole('listitem').filter({ hasText: /^Cajero/u })
  await form(page, cashier.getByRole('button', { name: 'Editar' }), 'Editar Cajero', 'dialogo-editar-rol')
  await checkWindow(page, { button: page.getByRole('button', { name: 'Eliminar el rol Cajero' }), role: 'alertdialog', title: '¿Eliminar el rol Cajero?', name: 'confirmar-eliminar-rol' })
})
