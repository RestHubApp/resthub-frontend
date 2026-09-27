import { describe, expect, it } from '@jest/globals'
import { act, screen, within } from '@testing-library/react'

import { costoDePlato, insumo, receta } from '#jest/fixtures/inventario'
import { entrarComo, montar, PERMISOS_ENCARGADO, RespuestaDeError, servidor } from '#jest/harness'
import type { PermissionCode, Recipe } from '../../api/types'
import InventoryView from './InventoryView'
import RecipeEditorView from './RecipeEditorView'

const RECETA = '/inventory/recipes/10'
const CEBOLLA = insumo({ id: 2, name: 'Cebolla', unit_cost: '0.002' })
const SOLO_LECTURA: PermissionCode[] = ['inventory.read']
const GUARDAR = { name: 'Guardar receta' }
const INSUMOS = '/inventory/ingredients'
const EN = '/inventario/recetas/10'
const RUTA = { path: '/inventario/recetas/:menuItemId', en: EN }

function abrirReceta(inicial: Recipe = receta(), permisos: readonly PermissionCode[] = PERMISOS_ENCARGADO) {
  const api = servidor().on('get', RECETA, inicial).on('get', INSUMOS, [insumo(), CEBOLLA])
  entrarComo(permisos)
  return { api, ...montar(<RecipeEditorView />, RUTA) }
}

function valor(termino: string) {
  return screen.getByText(termino).nextElementSibling
}

describe('RecipeEditorView', () => {
  it('muestra precio, costo y margen de la porción y cada línea con su costo', async () => {
    abrirReceta()

    expect(await screen.findByRole('heading', { name: 'Receta: Ceviche', level: 1 })).toBeInTheDocument()
    expect(valor('Costo por porción')).toHaveTextContent('S/ 1.00')
    expect(valor('Margen')).toHaveTextContent('S/ 29.00')
    expect(screen.getByLabelText('Limón')).toHaveValue('250')
    expect(screen.getByRole('link', { name: 'Volver a recetas' })).toHaveAttribute('href', '/inventario?vista=recetas')
  })

  it('agregar un insumo y escribir su cantidad recalcula el costo al instante y se guarda completo', async () => {
    const { api, user } = abrirReceta()
    api.on('put', RECETA, receta({ cost: '1.20' }))

    const guardar = await screen.findByRole('button', GUARDAR)
    expect(guardar).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Agregar insumo'), 'Cebolla (g)')
    expect(screen.queryByRole('option', { name: 'Limón (g)' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Agregar' }))
    await user.type(screen.getByLabelText('Cebolla'), '100')

    expect(valor('Costo por porción')).toHaveTextContent('S/ 1.20')
    expect(screen.getByText('Hay cambios sin guardar.')).toBeInTheDocument()
    await user.click(guardar)

    expect(await screen.findByText('Receta de Ceviche guardada.')).toBeInTheDocument()
    expect(api.llamadas('put', RECETA)[0]?.body).toEqual({
      lines: [
        { ingredient_id: 1, quantity: '250' },
        { ingredient_id: 2, quantity: '100' },
      ],
    })
  })

  it('quitar el último insumo avisa que guardar borra la receta', async () => {
    const { api, user } = abrirReceta()
    api.on('put', RECETA, receta({ has_recipe: false, lines: [], cost: null, margin: null, margin_percent: null }))

    await user.click(await screen.findByRole('button', { name: 'Quitar Limón' }))
    expect(screen.getByText('Sin insumos: al guardar, el plato queda sin receta y sin costo.')).toBeInTheDocument()
    expect(valor('Margen')).toHaveTextContent('—')
    await user.click(screen.getByRole('button', { name: 'Borrar receta' }))

    expect(await screen.findByText('Receta de Ceviche borrada.')).toBeInTheDocument()
    expect(api.llamadas('put', RECETA)[0]?.body).toEqual({ lines: [] })
  })

  it('una cantidad en cero no se guarda y un margen negativo se marca', async () => {
    const { api, user } = abrirReceta(receta({ price: '0.50' }))
    const campo = await screen.findByLabelText('Limón')
    expect(valor('Margen')).toHaveTextContent('-S/ 0.50')
    await user.clear(campo)
    await user.type(campo, '0')
    await user.click(screen.getByRole('button', GUARDAR))

    expect(await screen.findByText('Tiene que ser mayor que cero')).toBeInTheDocument()
    expect(api.llamadas('put', RECETA)).toHaveLength(0)
  })

  it('quien solo consulta ve la receta sin poder cambiarla', async () => {
    abrirReceta(receta(), SOLO_LECTURA)
    expect(await screen.findByLabelText('Limón')).toHaveAttribute('readonly')
    expect(screen.queryByRole('button', { name: 'Quitar Limón' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Agregar insumo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', GUARDAR)).not.toBeInTheDocument()
  })

  it('si el servidor rechaza el guardado, el error queda junto a la receta', async () => {
    const { api, user } = abrirReceta()
    api.on('put', RECETA, new RespuestaDeError(422, 'Un insumo ya no existe.'))
    await user.type(await screen.findByLabelText('Limón'), '0')
    await user.click(screen.getByRole('button', GUARDAR))
    expect(await screen.findByText('Un insumo ya no existe.')).toBeInTheDocument()
  })

  it('llegando desde el menú, vuelve al menú', async () => {
    servidor().on('get', RECETA, new RespuestaDeError(404, 'Ese plato no existe.')).on('get', INSUMOS, [])
    entrarComo()
    const { router } = montar(<RecipeEditorView />, RUTA)
    await act(() => router.navigate(EN, { state: { from: '/menu' } }))

    expect(await screen.findByText('Ese plato no existe.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Volver al menú' })).toHaveAttribute('href', '/menu')
  })
})

describe('RecipesPanel', () => {
  it('lista el costo y margen de cada plato, y avisa los que no tienen receta', async () => {
    servidor()
      .on('get', '/inventory/recipes', [
        costoDePlato(),
        costoDePlato({ menu_item_id: 11, menu_item_name: 'Causa', has_recipe: false, cost: null, margin: null, margin_percent: null, is_active: false }),
      ])
      .on('get', INSUMOS, [])
      .on('get', '/inventory/alerts/low-stock', [])
    entrarComo(SOLO_LECTURA)
    montar(<InventoryView />, { path: '/inventario', en: '/inventario?vista=recetas' })

    const fila = (await screen.findByText('Ceviche')).closest('tr') as HTMLElement
    expect(within(fila).getByText('S/ 18.00')).toBeInTheDocument()
    expect(within(fila).getByRole('link', { name: 'Ver receta de Ceviche' })).toHaveAttribute('href', EN)
    expect(screen.getByText('Sin receta')).toBeInTheDocument()
    expect(screen.getByText('Fuera de la carta')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear receta de Causa' })).toBeInTheDocument()
    expect(screen.getByText(/1 plato no tiene receta: al venderse no descuentan stock\./u)).toBeInTheDocument()
  })
})
