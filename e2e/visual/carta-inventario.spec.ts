// Regresión visual de la carta y del inventario, con cada ventana y cada
// confirmación que se abre desde ellos.
import type { Locator, Page } from '@playwright/test'

import { api, id } from '../soporte/gestion'
import { cubre } from '../soporte/cobertura'
import { abrirComo } from '../soporte/fixtures'
import { capturar, capturarVentana, expect, plazo, test } from './captura'

/** Abre una confirmación, la captura y la cancela. */
async function confirmacion(page: Page, boton: Locator, titulo: string, nombre: string): Promise<void> {
  await boton.click()
  const ventana = page.getByRole('alertdialog', { name: titulo })
  await capturarVentana(ventana, nombre)
  await ventana.getByRole('button', { name: 'Cancelar' }).click()
  await expect(ventana).toBeHidden()
}

/** Abre un formulario en ventana, lo captura y lo cierra con Escape. */
async function formulario(page: Page, boton: Locator, titulo: string | RegExp, nombre: string): Promise<void> {
  await boton.click()
  const ventana = page.getByRole('dialog', { name: titulo })
  await capturarVentana(ventana, nombre)
  await page.keyboard.press('Escape')
  await expect(ventana).toBeHidden()
}

test('VIS-08 la carta con sus ventanas de alta, edición y confirmaciones', async ({ page, local }) => {
  plazo(120_000)
  cubre(
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

  await abrirComo(page, local.encargado, '/menu')
  await expect(page.getByRole('region', { name: 'Postres' })).toBeVisible()
  await expect(page.getByText('Hoy: 5 de 5 platos disponibles')).toBeVisible()
  await capturar(page, 'menu')

  await formulario(page, page.getByRole('button', { name: 'Nueva categoría' }), 'Nueva categoría', 'dialogo-nueva-categoria')
  await formulario(page, page.getByRole('button', { name: 'Nuevo plato' }), 'Nuevo plato', 'dialogo-nuevo-plato')
  await formulario(page, page.getByRole('button', { name: 'Editar la categoría Fondos' }), 'Editar Fondos', 'dialogo-editar-categoria')
  await formulario(page, page.getByRole('button', { name: 'Editar Lomo saltado' }), 'Editar Lomo saltado', 'dialogo-editar-plato')

  await confirmacion(page, page.getByRole('button', { name: 'Desactivar la categoría Fondos' }), '¿Desactivar Fondos?', 'confirmar-desactivar-categoria')
  await confirmacion(page, page.getByRole('button', { name: 'Eliminar la categoría Postres' }), '¿Eliminar Postres?', 'confirmar-eliminar-categoria')
  const lomo = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Lomo saltado' }) })
  await confirmacion(page, lomo.getByRole('button', { name: 'Desactivar' }), '¿Sacar Lomo saltado de la carta?', 'confirmar-sacar-plato')
})

test('VIS-09 el inventario en cada pestaña, sus ventanas y la receta de un plato', async ({ page, local }) => {
  plazo(150_000)
  cubre(
    'ruta:/inventario',
    'pestanas:inventory/InventoryTabs',
    'dialogo:inventory/StockActionDialog',
    'dialogo:inventory/SupplierDialog',
    'dialogo:inventory/PurchaseOrderDialog',
    'dialogo:inventory/ReceiveOrderDialog',
    'ruta:/inventario/recetas/:menuItemId',
  )
  const proveedor = await api(local).post('/inventory/suppliers', {
    name: 'Mercado Mayorista',
    contact: 'Don Julio',
    phone: '987654321',
    notes: 'Entrega martes y viernes',
    is_active: true,
  })
  const orden = await api(local).post('/inventory/purchase-orders', {
    supplier_id: id(proveedor),
    notes: '',
    lines: [{ ingredient_id: local.insumos[2].id, quantity: '300', unit_cost: '0.012' }],
  })
  await api(local).post(`/inventory/purchase-orders/${String(id(orden))}/send`)

  await abrirComo(page, local.encargado, '/inventario')
  await expect(page.getByText('3 insumos')).toBeVisible()
  await capturar(page, 'inventario-insumos')

  await formulario(page, page.getByRole('button', { name: 'Merma de Cebolla roja' }), 'Registrar merma: Cebolla roja', 'dialogo-merma')
  await formulario(page, page.getByRole('button', { name: 'Compra de Culantro' }), 'Registrar compra: Culantro', 'dialogo-compra')
  await formulario(page, page.getByRole('button', { name: 'Ajuste de Lomo de res' }), /^Ajust.*Lomo de res$/u, 'dialogo-ajuste')

  const pestanas: readonly (readonly [RegExp, string, string])[] = [
    [/^Movimientos/u, 'Stock inicial', 'inventario-movimientos'],
    [/^Alertas/u, 'Culantro', 'inventario-alertas'],
    [/^Recetas/u, 'Lomo saltado', 'inventario-recetas'],
    [/^Compras/u, 'OC 1 · Mercado Mayorista', 'inventario-compras'],
    [/^Proveedores/u, 'Mercado Mayorista', 'inventario-proveedores'],
  ]
  for (const [pestana, texto, nombre] of pestanas) {
    await page.getByRole('tab', { name: pestana }).click()
    const panel = page.getByRole('tabpanel', { name: pestana })
    await expect(panel.getByText(texto).first()).toBeVisible()
    await capturar(page, nombre)
  }

  const proveedores = page.getByRole('tabpanel', { name: /^Proveedores/u })
  await formulario(page, proveedores.getByRole('button', { name: 'Nuevo proveedor' }), 'Nuevo proveedor', 'dialogo-proveedor')

  await page.getByRole('tab', { name: /^Compras/u }).click()
  const compras = page.getByRole('tabpanel', { name: /^Compras/u })
  await formulario(page, compras.getByRole('button', { name: 'Nueva orden' }), 'Nueva orden de compra', 'dialogo-orden-de-compra')
  const oc = compras.getByRole('listitem').filter({ hasText: 'OC 1 · Mercado Mayorista' })
  await formulario(page, oc.getByRole('button', { name: 'Recibir' }), 'Recibir la orden 1', 'dialogo-recibir-orden')

  await page.goto(`/inventario/recetas/${String(local.plato('Lomo saltado').id)}`)
  await expect(page.getByRole('heading', { name: 'Receta: Lomo saltado' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Lomo de res' })).toHaveValue('200')
  await capturar(page, 'receta')
})
