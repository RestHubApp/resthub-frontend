import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { buildMenu, dishCost, dish } from '#jest/fixtures/inventory'
import { signInAs, mountScreen, PERMISSIONS_OWNER, firstOf, ErrorResponse, server } from '#jest/harness'
import type { MenuResponse } from '@/api/types'
import { MenuView } from './MenuView'

const MENU = '/menu'
const COSTS = '/inventory/recipes'
const AVAILABILITY = '/menu/items/10/availability'
const ORDER_DISHES = '/menu/categories/1/items/order'
const CHECKED = 'aria-checked'
const AVAILABLE_CEVICHE = { name: 'Disponible hoy: Ceviche' }

/** Abre la ficha de un plato tocando su fila. */
async function openRecord(user: ReturnType<typeof openMenu>['user'], dish: string) {
  await user.click(await screen.findByRole('button', { name: `Ver la ficha de ${dish}` }))
  return screen.findByRole('dialog', { name: dish })
}

function openMenu(initial: MenuResponse = buildMenu(), permissions = PERMISSIONS_OWNER, at = '/menu') {
  const api = server()
    .on('get', MENU, initial)
    .on('get', COSTS, [dishCost(), dishCost({ menu_item_id: 11, menu_item_name: 'Causa', has_recipe: false, cost: null, margin: null, margin_percent: null })])
  signInAs(permissions)
  return { api, ...mountScreen(<MenuView />, { path: '/menu', en: at }) }
}

describe('MenuView: la carta', () => {
  it('muestra categorías, platos con precio y el resumen de lo disponible hoy', async () => {
    const { api } = openMenu()

    const entries = await screen.findByRole('region', { name: 'Entradas' })
    expect(within(entries).getByText('2 platos en carta, 1 agotado hoy')).toBeInTheDocument()
    expect(within(entries).getByText('S/ 30.00')).toBeInTheDocument()
    expect(within(entries).getByText('Agotado hoy')).toBeInTheDocument()
    expect(screen.getByText('Hoy: 1 de 2 platos disponibles')).toBeInTheDocument()
    expect(screen.getByText('Agotado hoy: Causa.')).toBeInTheDocument()
    expect(api.calls('get', MENU)[0]?.params).toEqual({ include_inactive: 'true' })
  })

  it('cada plato es una línea sin costo ni margen; la ficha trae el margen y el camino a su receta', async () => {
    const { user } = openMenu()

    const entries = await screen.findByRole('region', { name: 'Entradas' })
    expect(within(entries).queryByText(/Costo/u)).not.toBeInTheDocument()
    expect(within(entries).queryByRole('link')).not.toBeInTheDocument()

    const record = await openRecord(user, 'Ceviche')
    expect(within(record).getByText('Costo S/ 12.00 · Margen', { exact: false })).toBeInTheDocument()
    expect(within(record).getByRole('link', { name: 'Ver la receta de Ceviche' })).toHaveAttribute('href', '/inventario/recetas/10')
  })

  it('un plato sin receta ofrece agregarla desde su ficha', async () => {
    const { user } = openMenu()
    const record = await openRecord(user, 'Causa')
    expect(within(record).getByRole('link', { name: 'Agregar la receta de Causa' })).toBeInTheDocument()
  })

  it('marca el plato que se vende a pérdida', async () => {
    server().on('get', MENU, buildMenu()).on('get', COSTS, [dishCost({ cost: '35.00', margin: '-5.00', margin_percent: '-16.7' })])
    signInAs()
    const { user } = mountScreen(<MenuView />)

    expect(await within(await openRecord(user, 'Ceviche')).findByText(/se vende a pérdida/u)).toBeInTheDocument()
  })

  it('se abren «Nuevo plato» y «Nueva categoría» desde la dirección con ?accion=', async () => {
    openMenu(buildMenu(), PERMISSIONS_OWNER, '/menu?accion=nuevo-plato')
    expect(await screen.findByRole('dialog', { name: 'Nuevo plato' })).toBeInTheDocument()
  })

  it('sin permiso de inventario no pide los costos ni muestra márgenes', async () => {
    const { api } = openMenu(buildMenu(), PERMISSIONS_OWNER.filter((p) => p !== 'inventory.read'))

    await screen.findByRole('region', { name: 'Entradas' })
    expect(api.calls('get', COSTS)).toHaveLength(0)
    expect(screen.queryByText(/Margen/u)).not.toBeInTheDocument()
  })

  it('con la carta vacía invita a empezar y no deja crear platos', async () => {
    openMenu({ categories: [] })

    expect(await screen.findByText('La carta está vacía')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo plato' })).toBeDisabled()
  })

  it('si no carga, muestra el error del servidor', async () => {
    server().on('get', MENU, new ErrorResponse(500, 'Carta no disponible'))
    signInAs()
    mountScreen(<MenuView />)
    expect(await screen.findByText('Carta no disponible')).toBeInTheDocument()
  })
})

describe('MenuView: disponible hoy', () => {
  it('apagar el interruptor marca el plato agotado al instante y lo envía', async () => {
    const { api, user } = openMenu()
    api.on('patch', AVAILABILITY, () => {
      const fresh = buildMenu()
      const ceviche = { ...dish(), is_available: false }
      const first = firstOf(fresh.categories)
      fresh.categories[0] = { ...first, items: [ceviche, ...first.items.slice(1)] }
      api.on('get', MENU, fresh)
      return ceviche
    })

    const availabilitySwitch = await screen.findByRole('switch', AVAILABLE_CEVICHE)
    expect(availabilitySwitch).toHaveAttribute(CHECKED, 'true')
    await user.click(availabilitySwitch)

    expect(screen.getByRole('switch', AVAILABLE_CEVICHE)).toHaveAttribute(CHECKED, 'false')
    expect(api.calls('patch', AVAILABILITY)[0]?.body).toEqual({ is_available: false })
    expect(await screen.findByText('Hoy: 0 de 2 platos disponibles')).toBeInTheDocument()
  })

  it('si el servidor lo rechaza, vuelve atrás y avisa', async () => {
    const { api, user } = openMenu()
    api.on('patch', AVAILABILITY, new ErrorResponse(500, 'Sin conexión con la base'))

    await user.click(await screen.findByRole('switch', AVAILABLE_CEVICHE))

    expect(await screen.findByText('Sin conexión con la base')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('switch', AVAILABLE_CEVICHE)).toHaveAttribute(CHECKED, 'true')
    })
  })
})

describe('MenuView: orden', () => {
  it('bajar una categoría envía todas en el orden nuevo', async () => {
    const { api, user } = openMenu()
    api.on('put', '/menu/categories/order', [])

    await screen.findByRole('region', { name: 'Entradas' })
    await user.click(screen.getByRole('button', { name: 'Más acciones de la categoría Entradas' }))
    expect(await screen.findByRole('menuitem', { name: 'Subir' })).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('menuitem', { name: 'Bajar' }))

    expect(api.calls('put', '/menu/categories/order')[0]?.body).toEqual({ ids: [2, 1] })
  })

  it('subir un plato envía los platos de su categoría y el primero no puede subir', async () => {
    const { api, user } = openMenu()
    api.on('put', ORDER_DISHES, [])

    expect(within(await openRecord(user, 'Ceviche')).getByRole('button', { name: 'Subir' })).toBeDisabled()
    await user.keyboard('{Escape}')
    await user.click(within(await openRecord(user, 'Causa')).getByRole('button', { name: 'Subir' }))

    expect(api.calls('put', ORDER_DISHES)[0]?.body).toEqual({ ids: [11, 10] })
  })
})
