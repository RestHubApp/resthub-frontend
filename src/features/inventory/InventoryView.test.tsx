import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { ingredient } from '#jest/fixtures/inventory'
import { signInAs, mountScreen, PERMISSIONS_OWNER, ErrorResponse, server } from '#jest/harness'
import type { Ingredient, PermissionCode } from '@/api/types'
import { InventoryView } from './InventoryView'

const INGREDIENTS = '/inventory/ingredients'
const ALERTS = '/inventory/alerts/low-stock'
const RESTAURANT = '/restaurant'
const SEARCH = 'Buscar insumo'
const ONLY_READ: PermissionCode[] = ['inventory.read', 'orders.take']

const PAPA = ingredient({ id: 2, name: 'Papa amarilla', stock: '800', min_stock: '3000', is_low: true })
const ACEITE = ingredient({ id: 3, name: 'Aceite', unit: 'ml', unit_label: 'mililitros', stock: '-200', min_stock: '1000', is_low: true, is_negative: true })

function local(autoOutOfStock = false) {
  return {
    id: 1,
    name: 'La Picantería',
    slug: 'la-picanteria',
    timezone: 'America/Lima',
    is_active: true,
    auto_out_of_stock: autoOutOfStock,
    max_waiter_discount_percent: '10.00',
    external_ai_enabled: true,
    created_at: '2026-09-26T13:00:00Z',
  }
}

function open(permissions: readonly PermissionCode[] = PERMISSIONS_OWNER, alerts: Ingredient[] = [PAPA, ACEITE], en = '/inventario') {
  const api = server()
    .on('get', INGREDIENTS, [ACEITE, ingredient(), PAPA])
    .on('get', ALERTS, alerts)
    .on('get', RESTAURANT, local())
  signInAs(permissions)
  return { api, ...mountScreen(<InventoryView />, { path: '/inventario', en }) }
}

function cardOf(name: string): HTMLElement {
  const card = screen.getAllByRole('listitem').find((item) => within(item).queryByRole('heading', { name }) !== null)
  if (card === undefined) {
    throw new Error(`No se encontró la tarjeta de ${name}`)
  }
  return card
}

function rowOf(text: string): HTMLElement {
  const row = screen.getAllByRole('row').find((candidate) => within(candidate).queryByText(text) !== null)
  if (row === undefined) {
    throw new Error(`No se encontró la fila de ${text}`)
  }
  return row
}

describe('InventoryView: resumen y alertas', () => {
  it('dice cuántos insumos hay por reponer y cuántos en negativo', async () => {
    open()
    expect(await screen.findByText('2 insumos por reponer, 1 en negativo')).toBeInTheDocument()
    expect(screen.getByText('Papa amarilla, Aceite')).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: /Alertas\s*2/u })).toBeInTheDocument()
  })

  it('con todo sobre el mínimo lo dice y no ofrece ver alertas', async () => {
    open(PERMISSIONS_OWNER, [])
    expect(await screen.findByText('Stock en orden: nada por debajo del mínimo.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver alertas' })).not.toBeInTheDocument()
  })

  it('«Ver alertas» abre la pestaña con lo que falta para el mínimo y la compra a un toque', async () => {
    const { user } = open()
    await user.click(await screen.findByRole('button', { name: 'Ver alertas' }))

    await screen.findByRole('heading', { name: PAPA.name })
    const papa = cardOf(PAPA.name)
    expect(within(papa).getByText('Bajo mínimo')).toBeInTheDocument()
    expect(within(papa).getByText('2.2 kg')).toBeInTheDocument()
    const aceite = cardOf('Aceite')
    expect(within(aceite).getByText('Negativo')).toBeInTheDocument()

    await user.click(within(papa).getByRole('button', { name: 'Registrar compra de Papa amarilla' }))
    expect(await screen.findByRole('dialog', { name: 'Registrar compra: Papa amarilla' })).toBeInTheDocument()
  })

  it('sin alertas la pestaña lo dice', async () => {
    open(PERMISSIONS_OWNER, [], '/inventario?vista=alertas')
    expect(await screen.findByText('Nada por reponer')).toBeInTheDocument()
  })

  it('más de cuatro por reponer se resumen', async () => {
    const many = ['A', 'B', 'C', 'D', 'E', 'F'].map((name, i) => ingredient({ id: 10 + i, name, is_low: true }))
    open(PERMISSIONS_OWNER, many)
    expect(await screen.findByText('A, B, C, D y 2 más')).toBeInTheDocument()
  })
})

describe('InventoryView: tabla de insumos', () => {
  it('muestra stock, estado, mínimo y costo por kilo de cada insumo', async () => {
    open()
    await screen.findByText('Limón')
    const row = rowOf('Limón')
    expect(within(row).getByText('5 kg')).toBeInTheDocument()
    expect(within(row).getByText('Suficiente')).toBeInTheDocument()
    expect(within(row).getByText('S/ 4.00 por kg')).toBeInTheDocument()
    expect(screen.getByText('3 insumos')).toBeInTheDocument()
  })

  it('busca sin importar tildes ni mayúsculas y filtra lo que está bajo el mínimo', async () => {
    const { user } = open()
    await user.type(await screen.findByLabelText(SEARCH), 'LIMON')
    expect(screen.getByText('1 de 3 insumos')).toBeInTheDocument()
    expect(screen.queryByText('Aceite')).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText(SEARCH))
    await user.click(screen.getByLabelText('Solo bajo mínimo'))
    expect(screen.getByText('2 de 3 insumos')).toBeInTheDocument()
    expect(screen.queryByText('Limón')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(SEARCH), 'zzz')
    expect(screen.getByText('Ningún insumo coincide con la búsqueda.')).toBeInTheDocument()
  })

  it('cada fila ofrece compra, merma, ajuste y edición con el nombre del insumo', async () => {
    const { user } = open()
    await user.click(await screen.findByRole('button', { name: 'Merma de Limón' }))
    expect(await screen.findByRole('dialog', { name: 'Registrar merma: Limón' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Ajuste de Limón' }))
    expect(await screen.findByRole('dialog', { name: 'Ajustar stock: Limón' })).toBeInTheDocument()
  })

  it('quien solo consulta no ve acciones ni la regla de agotar platos', async () => {
    const { api } = open(ONLY_READ)
    await screen.findByText('Limón')
    expect(screen.queryByRole('button', { name: 'Nuevo insumo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compra de Limón' })).not.toBeInTheDocument()
    expect(screen.queryByText('Marcar «Sin insumos» automáticamente')).not.toBeInTheDocument()
    expect(api.calls('get', RESTAURANT)).toHaveLength(0)
  })

  it('si los insumos no cargan, lo dice', async () => {
    server().on('get', INGREDIENTS, new ErrorResponse(500, 'Inventario caído')).on('get', ALERTS, []).on('get', RESTAURANT, local())
    signInAs()
    mountScreen(<InventoryView />)
    expect(await screen.findByText('Inventario caído')).toBeInTheDocument()
  })
})

describe('InventoryView: regla de agotar platos', () => {
  it('encenderla la envía y avisa lo que cambia', async () => {
    const { api, user } = open()
    api.on('patch', RESTAURANT, () => {
      api.on('get', RESTAURANT, local(true))
      return local(true)
    })
    const checkbox = await screen.findByRole('checkbox', { name: /Marcar «Sin insumos» automáticamente/u })
    await user.click(checkbox)

    expect(await screen.findByText('Los platos sin insumos se agotan solos.')).toBeInTheDocument()
    expect(api.calls('patch', RESTAURANT)[0]?.body).toEqual({ auto_out_of_stock: true })
  })

  it('si el servidor la rechaza, avisa', async () => {
    const { api, user } = open()
    api.on('patch', RESTAURANT, new ErrorResponse(403, 'Solo el encargado.'))
    await user.click(await screen.findByRole('checkbox', { name: /Marcar «Sin insumos»/u }))
    expect(await screen.findByText('Solo el encargado.')).toBeInTheDocument()
  })
})
