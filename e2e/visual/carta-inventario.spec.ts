// Regresión visual de la carta y del inventario, con cada ventana y cada
// confirmación que se abre desde ellos.
import type { Locator, Page } from '@playwright/test'

import { api, id } from '../soporte/gestion'
import { covers } from '../soporte/cobertura'
import { openAs } from '../soporte/fixtures'
import { capture, captureWindow, expect, deadline, test } from './captura'

/** Abre una confirmación, la captura y la cancela. */
async function confirmation(page: Page, button: Locator, title: string, name: string): Promise<void> {
  await button.click()
  const windowValue = page.getByRole('alertdialog', { name: title })
  await captureWindow(windowValue, name)
  await windowValue.getByRole('button', { name: 'Cancelar' }).click()
  await expect(windowValue).toBeHidden()
}

/** Abre un formulario en ventana, lo captura y lo cierra con Escape. */
async function form(page: Page, button: Locator, title: string | RegExp, name: string): Promise<void> {
  await button.click()
  const windowValue = page.getByRole('dialog', { name: title })
  await captureWindow(windowValue, name)
  await page.keyboard.press('Escape')
  await expect(windowValue).toBeHidden()
}

test('VIS-08 la carta con sus ventanas de alta, edición y confirmaciones', async ({ page, local }) => {
  deadline(120_000)
  covers(
    'ruta:/menu',
    'dialogo:menu/NewMenuDialogs#1',
    'dialogo:menu/NewMenuDialogs#2',
    'dialogo:menu/CategoryHeader',
    'dialogo:menu/MenuItemRow',
    'confirmacion:menu/CategoryStatusButton',
    'confirmacion:menu/DeleteCategoryButton',
    'confirmacion:menu/MenuItemStatusButton',
  )
  await api(local).post('/menu/categories', { name: 'Postres' })

  await openAs(page, local.encargado, '/menu')
  await expect(page.getByRole('region', { name: 'Postres' })).toBeVisible()
  await expect(page.getByText('Hoy: 5 de 5 platos disponibles')).toBeVisible()
  await capture(page, 'menu')

  await form(page, page.getByRole('button', { name: 'Nueva categoría' }), 'Nueva categoría', 'dialogo-nueva-categoria')
  await form(page, page.getByRole('button', { name: 'Nuevo plato' }), 'Nuevo plato', 'dialogo-nuevo-plato')
  await form(page, page.getByRole('button', { name: 'Editar la categoría Fondos' }), 'Editar Fondos', 'dialogo-editar-categoria')
  await form(page, page.getByRole('button', { name: 'Editar Lomo saltado' }), 'Editar Lomo saltado', 'dialogo-editar-plato')

  await confirmation(page, page.getByRole('button', { name: 'Desactivar la categoría Fondos' }), '¿Desactivar Fondos?', 'confirmar-desactivar-categoria')
  await confirmation(page, page.getByRole('button', { name: 'Eliminar la categoría Postres' }), '¿Eliminar Postres?', 'confirmar-eliminar-categoria')
  const lomo = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Lomo saltado' }) })
  await confirmation(page, lomo.getByRole('button', { name: 'Desactivar' }), '¿Sacar Lomo saltado de la carta?', 'confirmar-sacar-plato')
})

test('VIS-09 el inventario en cada pestaña, sus ventanas y la receta de un plato', async ({ page, local }) => {
  deadline(150_000)
  covers(
    'ruta:/inventario',
    'pestanas:inventory/InventoryTabs',
    'dialogo:inventory/StockActionDialog',
    'dialogo:inventory/SupplierDialog',
    'dialogo:inventory/PurchaseOrderDialog',
    'dialogo:inventory/ReceiveOrderDialog',
    'ruta:/inventario/recetas/:menuItemId',
  )
  const supplier = await api(local).post('/inventory/suppliers', {
    name: 'Mercado Mayorista',
    contact: 'Don Julio',
    phone: '987654321',
    notes: 'Entrega martes y viernes',
    is_active: true,
  })
  const order = await api(local).post('/inventory/purchase-orders', {
    supplier_id: id(supplier),
    notes: '',
    lines: [{ ingredient_id: local.insumos[2].id, quantity: '300', unit_cost: '0.012' }],
  })
  await api(local).post(`/inventory/purchase-orders/${String(id(order))}/send`)

  await openAs(page, local.encargado, '/inventario')
  await expect(page.getByText('3 insumos')).toBeVisible()
  await capture(page, 'inventario-insumos')

  await form(page, page.getByRole('button', { name: 'Merma de Cebolla roja' }), 'Registrar merma: Cebolla roja', 'dialogo-merma')
  await form(page, page.getByRole('button', { name: 'Compra de Culantro' }), 'Registrar compra: Culantro', 'dialogo-compra')
  await form(page, page.getByRole('button', { name: 'Ajuste de Lomo de res' }), /^Ajust.*Lomo de res$/u, 'dialogo-ajuste')

  const tabs: readonly (readonly [RegExp, string, string])[] = [
    [/^Movimientos/u, 'Stock inicial', 'inventario-movimientos'],
    [/^Alertas/u, 'Culantro', 'inventario-alertas'],
    [/^Recetas/u, 'Lomo saltado', 'inventario-recetas'],
    [/^Compras/u, 'OC 1 · Mercado Mayorista', 'inventario-compras'],
    [/^Proveedores/u, 'Mercado Mayorista', 'inventario-proveedores'],
  ]
  for (const [tab, text, name] of tabs) {
    await page.getByRole('tab', { name: tab }).click()
    const panel = page.getByRole('tabpanel', { name: tab })
    await expect(panel.getByText(text).first()).toBeVisible()
    await capture(page, name)
  }

  const suppliers = page.getByRole('tabpanel', { name: /^Proveedores/u })
  await form(page, suppliers.getByRole('button', { name: 'Nuevo proveedor' }), 'Nuevo proveedor', 'dialogo-proveedor')

  await page.getByRole('tab', { name: /^Compras/u }).click()
  const purchases = page.getByRole('tabpanel', { name: /^Compras/u })
  await form(page, purchases.getByRole('button', { name: 'Nueva orden' }), 'Nueva orden de compra', 'dialogo-orden-de-compra')
  const oc = purchases.getByRole('listitem').filter({ hasText: 'OC 1 · Mercado Mayorista' })
  await form(page, oc.getByRole('button', { name: 'Recibir' }), 'Recibir la orden 1', 'dialogo-recibir-orden')

  await page.goto(`/inventario/recetas/${String(local.plato('Lomo saltado').id)}`)
  await expect(page.getByRole('heading', { name: 'Receta: Lomo saltado' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Lomo de res' })).toHaveValue('200')
  await capture(page, 'receta')
})
