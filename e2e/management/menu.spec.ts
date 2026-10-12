// HU06, HU07, HU33: la carta del encargado. Categorías y platos con su
// precio y su orden, las opciones y extras de un plato, lo agotado hoy y lo
// que sale de la carta.
import type { MenuResponse, MenuSection } from '../../src/api/types'
import { defined } from '../support/defined'
import { covers } from '../support/coverage'
import { openAs, notice, evidence, expect, test } from '../support/fixtures'
import { api, soles } from '../support/management'

async function menu(local: Parameters<typeof api>[0]): Promise<MenuSection[]> {
  return (await api(local).get<MenuResponse>('/menu?include_inactive=true')).categories
}

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-12 el encargado crea un plato con opciones, lo edita, lo marca agotado hoy, lo saca de la carta y reordena los platos', async ({ page, local }) => {
  covers(
    'ruta:/menu',
    'dialogo:menu/NewMenuDialogs#2',
    'hoja:menu/DishSheet',
    'funcion:menu.nuevo-plato',
    'funcion:menu.agregar-plato-en-categoria',
    'funcion:menu.opciones-del-plato',
    'funcion:menu.editar-plato',
    'funcion:menu.disponible-hoy',
    'funcion:menu.desactivar-plato',
    'funcion:menu.activar-plato',
    'funcion:menu.ordenar-platos',
  )
  await openAs(page, local.owner, '/menu')
  await expect(page.getByRole('heading', { level: 1, name: 'Menú' })).toBeVisible()
  const summary = page.getByRole('status').filter({ hasText: 'Hoy:' })
  await expect(summary).toContainText('Hoy: 5 de 5 platos disponibles')

  // Un plato nuevo desde su categoría, con un grupo de opciones obligatorio.
  const drinks = page.getByRole('region', { name: 'Bebidas' })
  await drinks.getByRole('button', { name: 'Agregar plato' }).click()
  const fresh = page.getByRole('dialog', { name: 'Nuevo plato' })
  await expect(fresh.getByLabel('Categoría')).toHaveValue(String(local.dish('Chicha morada').categoryId))
  await fresh.getByRole('button', { name: 'Crear plato' }).click()
  await expect(fresh.getByText('Escribe el nombre del plato')).toBeVisible()
  await expect(fresh.getByText('Escribe un valor')).toBeVisible()
  await fresh.getByLabel('Nombre').fill('Limonada frozen')
  await fresh.getByLabel('Precio (S/)').fill('9,50')
  await fresh.getByLabel('Descripción (opcional)').fill('Con hierbabuena.')
  await fresh.getByRole('button', { name: 'Agregar grupo de opciones' }).click()
  await fresh.getByRole('button', { name: 'Crear plato' }).click()
  await expect(fresh.getByText('Cada grupo de opciones necesita un nombre')).toBeVisible()
  await fresh.getByLabel('Grupo', { exact: true }).fill('Tamaño')
  await fresh.getByLabel('Una opción por línea').fill('Vaso\nJarra = 15.50')
  await fresh.getByRole('checkbox', { name: 'Obligatorio' }).click()
  await evidence(page, 'ges-12-1-nuevo-plato')
  await fresh.getByRole('button', { name: 'Crear plato' }).click()
  await expect(fresh).toBeHidden()
  await expect(drinks.getByRole('heading', { name: 'Limonada frozen' })).toBeVisible()
  await expect(summary).toContainText('Hoy: 6 de 6 platos disponibles')
  const created = (await menu(local)).flatMap((c) => c.items).find((p) => p.name === 'Limonada frozen')
  expect(created).toMatchObject({ price: '9.50', is_available: true })
  expect(defined(created).modifier_groups).toMatchObject([{ name: 'Tamaño', min_choices: 1, options: [{ name: 'Vaso' }, { name: 'Jarra', price: '15.50' }] }])

  // Editar: el precio y las opciones que ya tenía.
  await page.getByRole('button', { name: 'Ver la ficha de Limonada frozen' }).click()
  const record = page.getByRole('dialog', { name: 'Limonada frozen' })
  await expect(record).toContainText('Con hierbabuena.')
  await record.getByRole('button', { name: 'Editar plato' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar Limonada frozen' })
  await expect(edit.getByLabel('Grupo', { exact: true })).toHaveValue('Tamaño')
  await edit.getByLabel('Precio (S/)').fill('10')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(edit).toBeHidden()
  const row = drinks.getByRole('listitem').filter({ hasText: 'Limonada frozen' })
  await expect(row).toContainText(soles('10.00'))

  // Agotado hoy: un toque, sin confirmar.
  const availabilitySwitch = page.getByRole('switch', { name: 'Disponible hoy: Ceviche clásico' })
  await availabilitySwitch.click()
  await expect(availabilitySwitch).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('listitem').filter({ hasText: 'Ceviche clásico' })).toContainText('Agotado hoy')
  await expect(summary).toContainText('Hoy: 5 de 6 platos disponibles')
  await expect(summary).toContainText('Agotado hoy: Ceviche clásico.')
  await evidence(page, 'ges-12-2-agotado-hoy')
  await expect.poll(async () => (await menu(local)).flatMap((c) => c.items).find((p) => p.name === 'Ceviche clásico')?.is_available).toBe(false)
  await availabilitySwitch.click()
  await expect(availabilitySwitch).toHaveAttribute('aria-checked', 'true')

  // Sacar de la carta se confirma; volver a la carta, no.
  const aji = page.getByRole('listitem').filter({ hasText: 'Ají de gallina' })
  const ajiRecord = page.getByRole('dialog', { name: 'Ají de gallina' })
  await aji.getByRole('button', { name: 'Ver la ficha de Ají de gallina' }).click()
  await ajiRecord.getByRole('button', { name: 'Desactivar' }).click()
  const confirm = ajiRecord.getByRole('group', { name: '¿Sacar Ají de gallina de la carta?' })
  await confirm.getByRole('button', { name: 'Volver' }).click()
  await expect(confirm).toBeHidden()
  await expect(aji.getByText('Fuera de la carta')).toBeHidden()
  await ajiRecord.getByRole('button', { name: 'Desactivar' }).click()
  await evidence(page, 'ges-12-3-confirmar-desactivar')
  await confirm.getByRole('button', { name: 'Desactivar' }).click()
  await expect(ajiRecord).toBeHidden()
  await expect(aji.getByText('Fuera de la carta')).toBeVisible()
  await expect(aji.getByRole('switch')).toHaveCount(0)
  await expect(summary).toContainText('Hoy: 5 de 5 platos disponibles')
  await aji.getByRole('button', { name: 'Ver la ficha de Ají de gallina' }).click()
  await ajiRecord.getByRole('button', { name: 'Activar' }).click()
  await expect(ajiRecord).toBeHidden()
  await expect(aji.getByText('Fuera de la carta')).toBeHidden()

  // El orden es el que ve el mesero.
  const funds = page.getByRole('region', { name: 'Fondos' })
  await funds.getByRole('button', { name: 'Ver la ficha de Lomo saltado' }).click()
  const lomoRecord = page.getByRole('dialog', { name: 'Lomo saltado' })
  await expect(lomoRecord.getByRole('button', { name: 'Subir' })).toBeDisabled()
  await lomoRecord.getByRole('button', { name: 'Bajar' }).click()
  await page.keyboard.press('Escape')
  await expect(lomoRecord).toBeHidden()
  await expect(funds.getByRole('heading', { level: 3 }).first()).toHaveText('Ají de gallina')
  await expect.poll(async () => (await menu(local)).find((c) => c.name === 'Fondos')?.items.map((p) => p.name)).toEqual([
    'Ají de gallina',
    'Lomo saltado',
    'Ceviche clásico',
  ])
})

test('GES-13 el encargado crea, renombra, ordena, desactiva, activa y elimina categorías', async ({ page, local }) => {
  covers(
    'dialogo:menu/NewMenuDialogs#1',
    'dialogo:menu/CategoryDialogs',
    'confirmacion:menu/CategoryDialogs#1',
    'confirmacion:menu/CategoryDialogs#2',
    'funcion:menu.nueva-categoria',
    'funcion:menu.editar-categoria',
    'funcion:menu.ordenar-categorias',
    'funcion:menu.desactivar-categoria',
    'funcion:menu.activar-categoria',
    'funcion:menu.eliminar-categoria',
  )
  await openAs(page, local.owner, '/menu')
  await page.getByRole('button', { name: 'Nueva categoría' }).click()
  const fresh = page.getByRole('dialog', { name: 'Nueva categoría' })
  await fresh.getByRole('button', { name: 'Guardar' }).click()
  await expect(fresh.getByText('Escribe el nombre de la categoría')).toBeVisible()
  await fresh.getByLabel('Nombre').fill('Postres')
  await fresh.getByRole('button', { name: 'Guardar' }).click()
  await expect(fresh).toBeHidden()
  const desserts = page.getByRole('region', { name: 'Postres' })
  await expect(desserts.getByText('Todavía no tiene platos.')).toBeVisible()
  await expect(desserts.getByText('0 platos en carta')).toBeVisible()
  await evidence(page, 'ges-13-1-categoria-nueva')

  await desserts.getByRole('button', { name: 'Editar la categoría Postres' }).click()
  const edit = page.getByRole('dialog', { name: 'Editar Postres' })
  await edit.getByLabel('Nombre').fill('Dulces')
  await edit.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('region', { name: 'Dulces' })).toBeVisible()

  // La última categoría sube un lugar.
  const sweets = page.getByRole('region', { name: 'Dulces' })
  await sweets.getByRole('button', { name: 'Más acciones de la categoría Dulces' }).click()
  await expect(page.getByRole('menu', { name: 'Más acciones de la categoría Dulces' }).getByRole('menuitem', { name: 'Bajar' })).toHaveAttribute('aria-disabled', 'true')
  await page.getByRole('menu', { name: 'Más acciones de la categoría Dulces' }).getByRole('menuitem', { name: 'Subir' }).click()
  await expect(page.getByRole('heading', { level: 2 }).nth(1)).toHaveText('Dulces')
  await expect.poll(async () => (await menu(local)).map((c) => c.name)).toEqual(['Fondos', 'Dulces', 'Bebidas'])

  // Desactivar se confirma y no borra nada.
  const drinks = page.getByRole('region', { name: 'Bebidas' })
  await drinks.getByRole('button', { name: 'Más acciones de la categoría Bebidas' }).click()
  await page.getByRole('menu', { name: 'Más acciones de la categoría Bebidas' }).getByRole('menuitem', { name: 'Desactivar' }).click()
  const confirm = page.getByRole('alertdialog', { name: '¿Desactivar Bebidas?' })
  await expect(confirm).toContainText('No se borra nada')
  await confirm.getByRole('button', { name: 'Desactivar' }).click()
  await expect(drinks.getByText('Inactiva')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Hoy:' })).toContainText('Hoy: 3 de 3 platos disponibles')
  await evidence(page, 'ges-13-2-categoria-inactiva')
  await drinks.getByRole('button', { name: 'Más acciones de la categoría Bebidas' }).click()
  await page.getByRole('menu', { name: 'Más acciones de la categoría Bebidas' }).getByRole('menuitem', { name: 'Activar' }).click()
  await expect(drinks.getByText('Inactiva')).toBeHidden()

  // Solo una categoría vacía se elimina; una con platos no lo ofrece.
  await drinks.getByRole('button', { name: 'Más acciones de la categoría Bebidas' }).click()
  await expect(page.getByRole('menu', { name: 'Más acciones de la categoría Bebidas' }).getByRole('menuitem', { name: 'Eliminar' })).toHaveCount(0)
  await page.keyboard.press('Escape')
  await sweets.getByRole('button', { name: 'Más acciones de la categoría Dulces' }).click()
  await page.getByRole('menu', { name: 'Más acciones de la categoría Dulces' }).getByRole('menuitem', { name: 'Eliminar' }).click()
  const remove = page.getByRole('alertdialog', { name: '¿Eliminar Dulces?' })
  await remove.getByRole('button', { name: 'Cancelar' }).click()
  await expect(sweets).toBeVisible()
  await sweets.getByRole('button', { name: 'Más acciones de la categoría Dulces' }).click()
  await page.getByRole('menu', { name: 'Más acciones de la categoría Dulces' }).getByRole('menuitem', { name: 'Eliminar' }).click()
  await remove.getByRole('button', { name: 'Eliminar' }).click()
  await expect(notice(page, 'Categoría Dulces eliminada.')).toBeVisible()
  await expect(sweets).toBeHidden()
  expect((await menu(local)).map((c) => c.name)).toEqual(['Fondos', 'Bebidas'])
})
