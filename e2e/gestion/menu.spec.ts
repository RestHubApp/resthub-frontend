// HU06, HU07, HU33: la carta del encargado. Categorías y platos con su
// precio y su orden, las opciones y extras de un plato, lo agotado hoy y lo
// que sale de la carta.
import { cubre } from '../soporte/cobertura'
import { abrirComo, aviso, evidencia, expect, test } from '../soporte/fixtures'
import { api, soles } from '../soporte/gestion'

interface Seccion {
  readonly name: string
  readonly items: { readonly name: string; readonly is_available: boolean; readonly is_active: boolean }[]
}

async function carta(local: Parameters<typeof api>[0]): Promise<Seccion[]> {
  return (await api(local).get('/menu?include_inactive=true')).categories as Seccion[]
}

// Cada prueba es un recorrido largo de la pantalla con datos preparados por el
// API; con la máquina compartida por otras suites pasan de los 45 s por omisión.
test.beforeEach(() => {
  test.slow()
})

test('GES-12 el encargado crea un plato con opciones, lo edita, lo marca agotado hoy, lo saca de la carta y reordena los platos', async ({ page, local }) => {
  cubre(
    'ruta:/menu',
    'dialogo:menu/NewMenuDialogs#2',
    'dialogo:menu/MenuItemRow',
    'confirmacion:menu/MenuItemStatusButton',
    'funcion:menu.nuevo-plato',
    'funcion:menu.agregar-plato-en-categoria',
    'funcion:menu.opciones-del-plato',
    'funcion:menu.editar-plato',
    'funcion:menu.disponible-hoy',
    'funcion:menu.desactivar-plato',
    'funcion:menu.activar-plato',
    'funcion:menu.ordenar-platos',
  )
  await abrirComo(page, local.encargado, '/menu')
  await expect(page.getByRole('heading', { level: 1, name: 'Menú' })).toBeVisible()
  const resumen = page.getByRole('status').filter({ hasText: 'Hoy:' })
  await expect(resumen).toContainText('Hoy: 5 de 5 platos disponibles')

  // Un plato nuevo desde su categoría, con un grupo de opciones obligatorio.
  const bebidas = page.getByRole('region', { name: 'Bebidas' })
  await bebidas.getByRole('button', { name: 'Agregar plato' }).click()
  const nuevo = page.getByRole('dialog', { name: 'Nuevo plato' })
  await expect(nuevo.getByLabel('Categoría')).toHaveValue(String(local.plato('Chicha morada').categoriaId))
  await nuevo.getByRole('button', { name: 'Crear plato' }).click()
  await expect(nuevo.getByText('Escribe el nombre del plato')).toBeVisible()
  await expect(nuevo.getByText('Escribe un valor')).toBeVisible()
  await nuevo.getByLabel('Nombre').fill('Limonada frozen')
  await nuevo.getByLabel('Precio (S/)').fill('9,50')
  await nuevo.getByLabel('Descripción (opcional)').fill('Con hierbabuena.')
  await nuevo.getByRole('button', { name: 'Agregar grupo de opciones' }).click()
  await nuevo.getByRole('button', { name: 'Crear plato' }).click()
  await expect(nuevo.getByText('Cada grupo de opciones necesita un nombre')).toBeVisible()
  await nuevo.getByLabel('Grupo', { exact: true }).fill('Tamaño')
  await nuevo.getByLabel('Una opción por línea').fill('Vaso\nJarra = 15.50')
  await nuevo.getByRole('checkbox', { name: 'Obligatorio' }).click()
  await evidencia(page, 'ges-12-1-nuevo-plato')
  await nuevo.getByRole('button', { name: 'Crear plato' }).click()
  await expect(nuevo).toBeHidden()
  await expect(bebidas.getByRole('heading', { name: 'Limonada frozen' })).toBeVisible()
  await expect(bebidas.getByText('Con hierbabuena.')).toBeVisible()
  await expect(resumen).toContainText('Hoy: 6 de 6 platos disponibles')
  const creado = (await carta(local)).flatMap((c) => c.items).find((p) => p.name === 'Limonada frozen') as unknown as Record<string, unknown>
  expect(creado).toMatchObject({ price: '9.50', is_available: true })
  expect(creado.modifier_groups).toMatchObject([{ name: 'Tamaño', min_choices: 1, options: [{ name: 'Vaso' }, { name: 'Jarra', price: '15.50' }] }])

  // Editar: el precio y las opciones que ya tenía.
  await page.getByRole('button', { name: 'Editar Limonada frozen' }).click()
  const edicion = page.getByRole('dialog', { name: 'Editar Limonada frozen' })
  await expect(edicion.getByLabel('Grupo', { exact: true })).toHaveValue('Tamaño')
  await edicion.getByLabel('Precio (S/)').fill('10')
  await edicion.getByRole('button', { name: 'Guardar' }).click()
  await expect(edicion).toBeHidden()
  const fila = bebidas.getByRole('listitem').filter({ hasText: 'Limonada frozen' })
  await expect(fila).toContainText(soles('10.00'))

  // Agotado hoy: un toque, sin confirmar.
  const interruptor = page.getByRole('switch', { name: 'Disponible hoy: Ceviche clásico' })
  await interruptor.click()
  await expect(interruptor).toHaveAttribute('aria-checked', 'false')
  await expect(page.getByRole('listitem').filter({ hasText: 'Ceviche clásico' })).toContainText('Agotado hoy')
  await expect(resumen).toContainText('Hoy: 5 de 6 platos disponibles')
  await expect(resumen).toContainText('Agotado hoy: Ceviche clásico.')
  await evidencia(page, 'ges-12-2-agotado-hoy')
  await expect.poll(async () => (await carta(local)).flatMap((c) => c.items).find((p) => p.name === 'Ceviche clásico')?.is_available).toBe(false)
  await interruptor.click()
  await expect(interruptor).toHaveAttribute('aria-checked', 'true')

  // Sacar de la carta se confirma; volver a la carta, no.
  const aji = page.getByRole('listitem').filter({ hasText: 'Ají de gallina' })
  await aji.getByRole('button', { name: 'Desactivar' }).click()
  const confirmar = page.getByRole('alertdialog', { name: '¿Sacar Ají de gallina de la carta?' })
  await confirmar.getByRole('button', { name: 'Cancelar' }).click()
  await expect(confirmar).toBeHidden()
  await expect(aji.getByText('Fuera de la carta')).toBeHidden()
  await aji.getByRole('button', { name: 'Desactivar' }).click()
  await evidencia(page, 'ges-12-3-confirmar-desactivar')
  await confirmar.getByRole('button', { name: 'Desactivar' }).click()
  await expect(aji.getByText('Fuera de la carta')).toBeVisible()
  await expect(aji.getByRole('switch')).toHaveCount(0)
  await expect(resumen).toContainText('Hoy: 5 de 5 platos disponibles')
  await aji.getByRole('button', { name: 'Activar' }).click()
  await expect(aji.getByText('Fuera de la carta')).toBeHidden()

  // El orden es el que ve el mesero.
  const fondos = page.getByRole('region', { name: 'Fondos' })
  await expect(fondos.getByRole('button', { name: 'Subir Lomo saltado' })).toHaveAttribute('aria-disabled', 'true')
  await fondos.getByRole('button', { name: 'Bajar Lomo saltado' }).click()
  await expect(fondos.getByRole('heading', { level: 3 }).first()).toHaveText('Ají de gallina')
  await expect.poll(async () => (await carta(local)).find((c) => c.name === 'Fondos')?.items.map((p) => p.name)).toEqual([
    'Ají de gallina',
    'Lomo saltado',
    'Ceviche clásico',
  ])
})

test('GES-13 el encargado crea, renombra, ordena, desactiva, activa y elimina categorías', async ({ page, local }) => {
  cubre(
    'dialogo:menu/NewMenuDialogs#1',
    'dialogo:menu/CategoryHeader',
    'confirmacion:menu/CategoryStatusButton',
    'confirmacion:menu/DeleteCategoryButton',
    'funcion:menu.nueva-categoria',
    'funcion:menu.editar-categoria',
    'funcion:menu.ordenar-categorias',
    'funcion:menu.desactivar-categoria',
    'funcion:menu.activar-categoria',
    'funcion:menu.eliminar-categoria',
  )
  await abrirComo(page, local.encargado, '/menu')
  await page.getByRole('button', { name: 'Nueva categoría' }).click()
  const nueva = page.getByRole('dialog', { name: 'Nueva categoría' })
  await nueva.getByRole('button', { name: 'Guardar' }).click()
  await expect(nueva.getByText('Escribe el nombre de la categoría')).toBeVisible()
  await nueva.getByLabel('Nombre').fill('Postres')
  await nueva.getByRole('button', { name: 'Guardar' }).click()
  await expect(nueva).toBeHidden()
  const postres = page.getByRole('region', { name: 'Postres' })
  await expect(postres.getByText('Todavía no tiene platos.')).toBeVisible()
  await expect(postres.getByText('0 platos en carta')).toBeVisible()
  await evidencia(page, 'ges-13-1-categoria-nueva')

  await postres.getByRole('button', { name: 'Editar la categoría Postres' }).click()
  const editar = page.getByRole('dialog', { name: 'Editar Postres' })
  await editar.getByLabel('Nombre').fill('Dulces')
  await editar.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('region', { name: 'Dulces' })).toBeVisible()

  // La última categoría sube un lugar.
  const dulces = page.getByRole('region', { name: 'Dulces' })
  await expect(dulces.getByRole('button', { name: 'Bajar la categoría Dulces' })).toHaveAttribute('aria-disabled', 'true')
  await dulces.getByRole('button', { name: 'Subir la categoría Dulces' }).click()
  await expect(page.getByRole('heading', { level: 2 }).nth(1)).toHaveText('Dulces')
  await expect.poll(async () => (await carta(local)).map((c) => c.name)).toEqual(['Fondos', 'Dulces', 'Bebidas'])

  // Desactivar se confirma y no borra nada.
  const bebidas = page.getByRole('region', { name: 'Bebidas' })
  await bebidas.getByRole('button', { name: 'Desactivar la categoría Bebidas' }).click()
  const confirmar = page.getByRole('alertdialog', { name: '¿Desactivar Bebidas?' })
  await expect(confirmar).toContainText('No se borra nada')
  await confirmar.getByRole('button', { name: 'Desactivar' }).click()
  await expect(bebidas.getByText('Inactiva')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Hoy:' })).toContainText('Hoy: 3 de 3 platos disponibles')
  await evidencia(page, 'ges-13-2-categoria-inactiva')
  await bebidas.getByRole('button', { name: 'Activar la categoría Bebidas' }).click()
  await expect(bebidas.getByText('Inactiva')).toBeHidden()

  // Solo una categoría vacía se elimina; una con platos no lo ofrece.
  await expect(bebidas.getByRole('button', { name: 'Eliminar la categoría Bebidas' })).toHaveCount(0)
  await dulces.getByRole('button', { name: 'Eliminar la categoría Dulces' }).click()
  const eliminar = page.getByRole('alertdialog', { name: '¿Eliminar Dulces?' })
  await eliminar.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dulces).toBeVisible()
  await dulces.getByRole('button', { name: 'Eliminar la categoría Dulces' }).click()
  await eliminar.getByRole('button', { name: 'Eliminar' }).click()
  await expect(aviso(page, 'Categoría Dulces eliminada.')).toBeVisible()
  await expect(dulces).toBeHidden()
  expect((await carta(local)).map((c) => c.name)).toEqual(['Fondos', 'Bebidas'])
})
