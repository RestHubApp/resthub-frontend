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
const SCREEN = '/inventario'
const RULES = 'Reglas de stock'
const LOW_ONLY = 'Solo bajo mínimo'
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
    waste_approval_threshold: '50.00',
    external_ai_enabled: true,
    created_at: '2026-09-26T13:00:00Z',
  }
}

function open(permissions: readonly PermissionCode[] = PERMISSIONS_OWNER, alerts: Ingredient[] = [PAPA, ACEITE], en = SCREEN) {
  const api = server()
    .on('get', INGREDIENTS, [ACEITE, ingredient(), PAPA])
    .on('get', ALERTS, alerts)
    .on('get', RESTAURANT, local())
  signInAs(permissions)
  return { api, ...mountScreen(<InventoryView />, { path: SCREEN, en }) }
}

function rowOf(text: string): HTMLElement {
  const row = screen.getAllByRole('row').find((candidate) => within(candidate).queryByText(text) !== null)
  if (row === undefined) {
    throw new Error(`No se encontró la fila de ${text}`)
  }
  return row
}

describe('InventoryView: lo que hay que reponer', () => {
  it('dice cuántos insumos están por reponer junto al filtro y ya no hay banner ni pestaña de alertas', async () => {
    open()
    expect(await screen.findByText(', 2 por reponer')).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Alertas/u })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver alertas' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Insumos',
      'Movimientos',
      'Conteos',
      'Recetas',
      'Compras',
      'Proveedores',
    ])
  })

  it('con todo sobre el mínimo no menciona reposición', async () => {
    server().on('get', INGREDIENTS, [ingredient()]).on('get', ALERTS, []).on('get', RESTAURANT, local())
    signInAs()
    mountScreen(<InventoryView />, { path: SCREEN, en: SCREEN })
    expect(await screen.findByText('1 insumos')).toBeInTheDocument()
  })

  it('«Solo bajo mínimo» deja los insumos por reponer y la compra a un toque', async () => {
    const { user } = open()
    await user.click(await screen.findByLabelText(LOW_ONLY))

    const papa = rowOf(PAPA.name)
    expect(within(papa).getByText('Bajo mínimo')).toBeInTheDocument()
    expect(within(rowOf('Aceite')).getByText('Negativo')).toBeInTheDocument()

    await user.click(within(papa).getByRole('button', { name: 'Compra de Papa amarilla' }))
    expect(await screen.findByRole('dialog', { name: 'Registrar compra: Papa amarilla' })).toBeInTheDocument()
  })

  it('un enlace viejo a las alertas cae en los insumos', async () => {
    open(PERMISSIONS_OWNER, [], '/inventario?vista=alertas')
    expect(await screen.findByLabelText(SEARCH)).toBeInTheDocument()
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
    await user.click(screen.getByLabelText(LOW_ONLY))
    expect(screen.getByText('2 de 3 insumos')).toBeInTheDocument()
    expect(screen.queryByText('Limón')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(SEARCH), 'zzz')
    expect(screen.getByText('Ningún insumo coincide con la búsqueda.')).toBeInTheDocument()
  })

  it('cada fila ofrece la compra a la vista y merma, ajuste y edición en su menú, con el nombre del insumo', async () => {
    const { user } = open()
    await user.click(await screen.findByRole('button', { name: 'Más acciones de Limón' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Merma' }))
    expect(await screen.findByRole('dialog', { name: 'Registrar merma: Limón' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await user.click(screen.getByRole('button', { name: 'Más acciones de Limón' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Ajuste' }))
    expect(await screen.findByRole('dialog', { name: 'Ajustar stock: Limón' })).toBeInTheDocument()
  })

  it('quien solo consulta no ve acciones ni las reglas de stock', async () => {
    const { api } = open(ONLY_READ)
    await screen.findByText('Limón')
    expect(screen.queryByRole('button', { name: 'Nuevo insumo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Compra de Limón' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: RULES })).not.toBeInTheDocument()
    expect(api.calls('get', RESTAURANT)).toHaveLength(0)
  })

  it('si los insumos no cargan, lo dice', async () => {
    server().on('get', INGREDIENTS, new ErrorResponse(500, 'Inventario caído')).on('get', ALERTS, []).on('get', RESTAURANT, local())
    signInAs()
    mountScreen(<InventoryView />)
    expect(await screen.findByText('Inventario caído')).toBeInTheDocument()
  })
})

describe('InventoryView: reglas de stock', () => {
  async function openRules(user: ReturnType<typeof open>['user']) {
    await user.click(await screen.findByRole('button', { name: RULES }))
    return screen.findByRole('checkbox', { name: /Marcar «Sin insumos» automáticamente/u })
  }

  it('la regla de agotar platos vive en una hoja y no en la pantalla', async () => {
    const { user } = open()
    await screen.findByText('Limón')
    expect(screen.queryByText('Marcar «Sin insumos» automáticamente')).not.toBeInTheDocument()

    await openRules(user)
    expect(screen.getByRole('dialog', { name: RULES })).toBeInTheDocument()
  })

  it('se abre sola desde la dirección con ?accion=reglas-de-stock', async () => {
    open(PERMISSIONS_OWNER, [], '/inventario?accion=reglas-de-stock')
    expect(await screen.findByRole('dialog', { name: RULES })).toBeInTheDocument()
  })

  it('encenderla la envía y avisa lo que cambia', async () => {
    const { api, user } = open()
    api.on('patch', RESTAURANT, () => {
      api.on('get', RESTAURANT, local(true))
      return local(true)
    })
    await user.click(await openRules(user))

    expect(await screen.findByText('Los platos sin insumos se agotan solos.')).toBeInTheDocument()
    expect(api.calls('patch', RESTAURANT)[0]?.body).toEqual({ auto_out_of_stock: true })
  })

  it('si el servidor la rechaza, avisa', async () => {
    const { api, user } = open()
    api.on('patch', RESTAURANT, new ErrorResponse(403, 'Solo el encargado.'))
    await user.click(await openRules(user))
    expect(await screen.findByText('Solo el encargado.')).toBeInTheDocument()
  })
})
