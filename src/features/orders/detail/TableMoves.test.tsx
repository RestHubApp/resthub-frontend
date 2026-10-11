import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { table, payment, handleOrder } from '#jest/fixtures/cobro'
import { signInAs, handleMount, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server } from '#jest/harness'
import type { ActiveOrderSummary, OrderResponse, PermissionCode } from '@/api/types'
import { TableMoves } from './TableMoves'

const JOIN = { name: 'Unir otra mesa' }
const MOVE = { name: 'Cambiar de mesa' }
const HOUR = '2026-09-26T17:00:00Z'

function summary(id: number, waiterId: number): ActiveOrderSummary {
  return {
    id,
    number: id + 100,
    status: 'served',
    status_label: 'Servido',
    total: '40.00',
    balance: '40.00',
    item_count: 2,
    waiter_id: waiterId,
    waiter_name: waiterId === 7 ? 'Ana Torres' : 'Luis Paz',
    created_at: HOUR,
    updated_at: HOUR,
    status_changed_at: HOUR,
  }
}

const SALON = [
  table({ id: 3, label: '3', status: 'occupied', active_order: summary(12, 7) }),
  table({ id: 4, label: '4' }),
  table({ id: 5, label: 'Terraza', status: 'occupied', active_order: summary(20, 7) }),
  table({ id: 6, label: '6', status: 'occupied', active_order: summary(21, 8) }),
]

function move(permissions: readonly PermissionCode[] = PERMISSIONS_WAITER, order: OrderResponse = handleOrder()) {
  const api = server().on('get', '/tables', SALON)
  signInAs(permissions)
  return { api, ...handleMount(<TableMoves order={order} />) }
}

describe('TableMoves', () => {
  it('cambiar de mesa ofrece solo las libres y muda el pedido', async () => {
    const { api, user } = move()
    api.on('post', '/orders/12/move', handleOrder({ table_id: 4, table_label: '4' }))

    await user.click(screen.getByRole('button', MOVE))
    const window = within(await screen.findByRole('dialog', MOVE))
    await user.click(await window.findByRole('button', { name: 'Mesa 4' }))

    expect(window.queryByRole('button', { name: /Terraza/u })).not.toBeInTheDocument()
    expect(await screen.findByText('Pedido #34 ahora en Mesa 4.')).toBeInTheDocument()
    expect(api.llamadas('post', '/orders/12/move')[0]?.body).toEqual({ table_id: 4 })
  })

  it('el mesero solo une mesas suyas, y nunca la misma', async () => {
    const { api, user } = move()
    api.on('post', '/orders/12/merge', handleOrder())

    await user.click(screen.getByRole('button', JOIN))
    const window = within(await screen.findByRole('dialog', { name: 'Unir otra mesa a esta' }))
    const terrace = await window.findByRole('button', { name: /Terraza/u })

    expect(terrace).toHaveTextContent('#120 · S/ 40.00')
    expect(window.queryByRole('button', { name: /Mesa 6/u })).not.toBeInTheDocument()
    expect(window.queryByRole('button', { name: /Mesa 3/u })).not.toBeInTheDocument()
    await user.click(terrace)
    expect(await screen.findByText('Mesas unidas en el pedido #34.')).toBeInTheDocument()
    expect(api.llamadas('post', '/orders/12/merge')[0]?.body).toEqual({ source_order_id: 20 })
  })

  it('el encargado puede unir mesas de cualquier mesero', async () => {
    const { user } = move(PERMISSIONS_OWNER)

    await user.click(screen.getByRole('button', JOIN))

    expect(await screen.findByRole('button', { name: /Mesa 6/u })).toBeInTheDocument()
  })

  it('sin otras mesas propias lo dice', async () => {
    const { api, user } = move()
    api.on('get', '/tables', [SALON[0]])

    await user.click(screen.getByRole('button', JOIN))

    expect(await screen.findByText('No tienes otras mesas con pedido')).toBeInTheDocument()
  })

  it('con un pago hecho, o en la mesa de otro mesero, no se ofrece unir', () => {
    move(PERMISSIONS_WAITER, handleOrder({ payments: [payment()] }))
    move(PERMISSIONS_WAITER, handleOrder({ waiter_id: 8 }))

    expect(screen.queryByRole('button', JOIN)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', MOVE)).toHaveLength(2)
  })
})
