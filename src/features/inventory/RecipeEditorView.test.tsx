import { describe, expect, it } from '@jest/globals'
import { act, screen, within } from '@testing-library/react'

import { dishCost, ingredient, recipe } from '#jest/fixtures/inventario'
import { signInAs, handleMount, PERMISSIONS_OWNER, ErrorResponse, server } from '#jest/harness'
import type { PermissionCode, Recipe } from '@/api/types'
import { InventoryView } from './InventoryView'
import { RecipeEditorView } from './RecipeEditorView'

const RECIPE = '/inventory/recipes/10'
const CEBOLLA = ingredient({ id: 2, name: 'Cebolla', unit_cost: '0.002' })
const ONLY_READ: PermissionCode[] = ['inventory.read']
const SAVE = { name: 'Guardar receta' }
const INGREDIENTS = '/inventory/ingredients'
const EN = '/inventario/recetas/10'
const ROUTE = { path: '/inventario/recetas/:menuItemId', en: EN }

function openRecipe(initial: Recipe = recipe(), permissions: readonly PermissionCode[] = PERMISSIONS_OWNER) {
  const api = server().on('get', RECIPE, initial).on('get', INGREDIENTS, [ingredient(), CEBOLLA])
  signInAs(permissions)
  return { api, ...handleMount(<RecipeEditorView />, ROUTE) }
}

function value(term: string) {
  return screen.getByText(term).nextElementSibling
}

describe('RecipeEditorView', () => {
  it('muestra precio, costo y margen de la porción y cada línea con su costo', async () => {
    openRecipe()

    expect(await screen.findByRole('heading', { name: 'Receta: Ceviche', level: 1 })).toBeInTheDocument()
    expect(value('Costo por porción')).toHaveTextContent('S/ 1.00')
    expect(value('Margen')).toHaveTextContent('S/ 29.00')
    expect(screen.getByLabelText('Limón')).toHaveValue('250')
    expect(screen.getByRole('link', { name: 'Volver a recetas' })).toHaveAttribute('href', '/inventario?vista=recetas')
  })

  it('agregar un insumo y escribir su cantidad recalcula el costo al instante y se guarda completo', async () => {
    const { api, user } = openRecipe()
    api.on('put', RECIPE, recipe({ cost: '1.20' }))

    const save = await screen.findByRole('button', SAVE)
    expect(save).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Agregar insumo'), 'Cebolla (g)')
    expect(screen.queryByRole('option', { name: 'Limón (g)' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agregar' }))
    await user.type(screen.getByLabelText('Cebolla'), '100')

    expect(value('Costo por porción')).toHaveTextContent('S/ 1.20')
    expect(screen.getByText('Hay cambios sin guardar.')).toBeInTheDocument()
    await user.click(save)

    expect(await screen.findByText('Receta de Ceviche guardada.')).toBeInTheDocument()
    expect(api.calls('put', RECIPE)[0]?.body).toEqual({
      lines: [
        { ingredient_id: 1, quantity: '250' },
        { ingredient_id: 2, quantity: '100' },
      ],
    })
  })

  it('quitar el último insumo avisa que guardar borra la receta', async () => {
    const { api, user } = openRecipe()
    api.on('put', RECIPE, recipe({ has_recipe: false, lines: [], cost: null, margin: null, margin_percent: null }))

    await user.click(await screen.findByRole('button', { name: 'Quitar Limón' }))
    expect(screen.getByText('Sin insumos: al guardar, el plato queda sin receta y sin costo.')).toBeInTheDocument()
    expect(value('Margen')).toHaveTextContent('—')
    await user.click(screen.getByRole('button', { name: 'Borrar receta' }))

    expect(await screen.findByText('Receta de Ceviche borrada.')).toBeInTheDocument()
    expect(api.calls('put', RECIPE)[0]?.body).toEqual({ lines: [] })
  })

  it('una cantidad en cero no se guarda y un margen negativo se marca', async () => {
    const { api, user } = openRecipe(recipe({ price: '0.50' }))
    const field = await screen.findByLabelText('Limón')
    expect(value('Margen')).toHaveTextContent('-S/ 0.50')
    await user.clear(field)
    await user.type(field, '0')
    await user.click(screen.getByRole('button', SAVE))

    expect(await screen.findByText('Tiene que ser mayor que cero')).toBeInTheDocument()
    expect(api.calls('put', RECIPE)).toHaveLength(0)
  })

  it('quien solo consulta ve la receta sin poder cambiarla', async () => {
    openRecipe(recipe(), ONLY_READ)
    expect(await screen.findByLabelText('Limón')).toHaveAttribute('readonly')
    expect(screen.queryByRole('button', { name: 'Quitar Limón' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Agregar insumo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', SAVE)).not.toBeInTheDocument()
  })

  it('si el servidor rechaza el guardado, el error queda junto a la receta', async () => {
    const { api, user } = openRecipe()
    api.on('put', RECIPE, new ErrorResponse(422, 'Un insumo ya no existe.'))
    await user.type(await screen.findByLabelText('Limón'), '0')
    await user.click(screen.getByRole('button', SAVE))
    expect(await screen.findByText('Un insumo ya no existe.')).toBeInTheDocument()
  })

  it('llegando desde el menú, vuelve al menú', async () => {
    server().on('get', RECIPE, new ErrorResponse(404, 'Ese plato no existe.')).on('get', INGREDIENTS, [])
    signInAs()
    const { router } = handleMount(<RecipeEditorView />, ROUTE)
    await act(() => router.navigate(EN, { state: { from: '/menu' } }))

    expect(await screen.findByText('Ese plato no existe.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Volver al menú' })).toHaveAttribute('href', '/menu')
  })
})

describe('RecipesPanel', () => {
  it('lista el costo y margen de cada plato, y avisa los que no tienen receta', async () => {
    server()
      .on('get', '/inventory/recipes', [
        dishCost(),
        dishCost({ menu_item_id: 11, menu_item_name: 'Causa', has_recipe: false, cost: null, margin: null, margin_percent: null, is_active: false }),
      ])
      .on('get', INGREDIENTS, [])
      .on('get', '/inventory/alerts/low-stock', [])
    signInAs(ONLY_READ)
    handleMount(<InventoryView />, { path: '/inventario', en: '/inventario?vista=recetas' })

    const row = (await screen.findByText('Ceviche')).closest('tr') as HTMLElement
    expect(within(row).getByText('S/ 18.00')).toBeInTheDocument()
    expect(within(row).getByRole('link', { name: 'Ver receta de Ceviche' })).toHaveAttribute('href', EN)
    expect(screen.getByText('Sin receta')).toBeInTheDocument()
    expect(screen.getByText('Fuera de la carta')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear receta de Causa' })).toBeInTheDocument()
    expect(screen.getByText(/1 plato no tiene receta: al venderse no descuentan stock\./u)).toBeInTheDocument()
  })
})
