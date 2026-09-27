import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { carta, costoDePlato, plato } from '#jest/fixtures/inventario'
import { entrarComo, montar, PERMISOS_ENCARGADO, RespuestaDeError, servidor } from '#jest/harness'
import type { MenuResponse } from '../../api/types'
import MenuView from './MenuView'

const MENU = '/menu'
const COSTOS = '/inventory/recipes'
const DISPONIBILIDAD = '/menu/items/10/availability'
const ORDEN_PLATOS = '/menu/categories/1/items/order'
const CHECKED = 'aria-checked'
const DISPONIBLE_CEVICHE = { name: 'Disponible hoy: Ceviche' }

function abrirMenu(inicial: MenuResponse = carta(), permisos = PERMISOS_ENCARGADO) {
  const api = servidor()
    .on('get', MENU, inicial)
    .on('get', COSTOS, [costoDePlato(), costoDePlato({ menu_item_id: 11, menu_item_name: 'Causa', has_recipe: false, cost: null, margin: null, margin_percent: null })])
  entrarComo(permisos)
  return { api, ...montar(<MenuView />, { path: '/menu' }) }
}

describe('MenuView: la carta', () => {
  it('muestra categorías, platos con precio y el resumen de lo disponible hoy', async () => {
    const { api } = abrirMenu()

    const entradas = await screen.findByRole('region', { name: 'Entradas' })
    expect(within(entradas).getByText('2 platos en carta, 1 agotado hoy')).toBeInTheDocument()
    expect(within(entradas).getByText('S/ 30.00')).toBeInTheDocument()
    expect(within(entradas).getByText('Agotado hoy')).toBeInTheDocument()
    expect(screen.getByText('Hoy: 1 de 2 platos disponibles')).toBeInTheDocument()
    expect(screen.getByText('Agotado hoy: Causa.')).toBeInTheDocument()
    expect(api.llamadas('get', MENU)[0]?.params).toEqual({ include_inactive: true })
  })

  it('con acceso al inventario muestra el margen de cada plato y el camino a su receta', async () => {
    abrirMenu()

    expect(await screen.findByText(/Costo S\/ 12\.00 · Margen/u)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver la receta de Ceviche' })).toHaveAttribute('href', '/inventario/recetas/10')
    expect(screen.getByRole('link', { name: 'Agregar la receta de Causa' })).toBeInTheDocument()
  })

  it('marca el plato que se vende a pérdida', async () => {
    servidor().on('get', MENU, carta()).on('get', COSTOS, [costoDePlato({ cost: '35.00', margin: '-5.00', margin_percent: '-16.7' })])
    entrarComo()
    montar(<MenuView />)

    expect(await screen.findByText(/se vende a pérdida/u)).toBeInTheDocument()
  })

  it('sin permiso de inventario no pide los costos ni muestra márgenes', async () => {
    const { api } = abrirMenu(carta(), PERMISOS_ENCARGADO.filter((p) => p !== 'inventory.read'))

    await screen.findByRole('region', { name: 'Entradas' })
    expect(api.llamadas('get', COSTOS)).toHaveLength(0)
    expect(screen.queryByText(/Margen/u)).not.toBeInTheDocument()
  })

  it('con la carta vacía invita a empezar y no deja crear platos', async () => {
    abrirMenu({ categories: [] })

    expect(await screen.findByText('La carta está vacía')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nuevo plato' })).toBeDisabled()
  })

  it('si no carga, muestra el error del servidor', async () => {
    servidor().on('get', MENU, new RespuestaDeError(500, 'Carta no disponible'))
    entrarComo()
    montar(<MenuView />)
    expect(await screen.findByText('Carta no disponible')).toBeInTheDocument()
  })
})

describe('MenuView: disponible hoy', () => {
  it('apagar el interruptor marca el plato agotado al instante y lo envía', async () => {
    const { api, user } = abrirMenu()
    api.on('patch', DISPONIBILIDAD, () => {
      const nueva = carta()
      const ceviche = { ...plato(), is_available: false }
      nueva.categories[0] = { ...nueva.categories[0], items: [ceviche, ...nueva.categories[0].items.slice(1)] }
      api.on('get', MENU, nueva)
      return ceviche
    })

    const interruptor = await screen.findByRole('switch', DISPONIBLE_CEVICHE)
    expect(interruptor).toHaveAttribute(CHECKED, 'true')
    await user.click(interruptor)

    expect(screen.getByRole('switch', DISPONIBLE_CEVICHE)).toHaveAttribute(CHECKED, 'false')
    expect(api.llamadas('patch', DISPONIBILIDAD)[0]?.body).toEqual({ is_available: false })
    expect(await screen.findByText('Hoy: 0 de 2 platos disponibles')).toBeInTheDocument()
  })

  it('si el servidor lo rechaza, vuelve atrás y avisa', async () => {
    const { api, user } = abrirMenu()
    api.on('patch', DISPONIBILIDAD, new RespuestaDeError(500, 'Sin conexión con la base'))

    await user.click(await screen.findByRole('switch', DISPONIBLE_CEVICHE))

    expect(await screen.findByText('Sin conexión con la base')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('switch', DISPONIBLE_CEVICHE)).toHaveAttribute(CHECKED, 'true')
    })
  })
})

describe('MenuView: orden', () => {
  it('bajar una categoría envía todas en el orden nuevo', async () => {
    const { api, user } = abrirMenu()
    api.on('put', '/menu/categories/order', [])

    await screen.findByRole('region', { name: 'Entradas' })
    expect(screen.getByRole('button', { name: 'Subir la categoría Entradas' })).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('button', { name: 'Bajar la categoría Entradas' }))

    expect(api.llamadas('put', '/menu/categories/order')[0]?.body).toEqual({ ids: [2, 1] })
  })

  it('subir un plato envía los platos de su categoría y no hace nada en el borde', async () => {
    const { api, user } = abrirMenu()
    api.on('put', ORDEN_PLATOS, [])

    await user.click(await screen.findByRole('button', { name: 'Subir Ceviche' }))
    expect(api.llamadas('put', ORDEN_PLATOS)).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Subir Causa' }))

    expect(api.llamadas('put', ORDEN_PLATOS)[0]?.body).toEqual({ ids: [11, 10] })
  })
})
