import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { mesa, pago, pedido } from '#jest/fixtures/cobro'
import { entrarComo, montar, PERMISOS_ENCARGADO, PERMISOS_MESERO, servidor } from '#jest/harness'
import type { ActiveOrderSummary, OrderResponse, PermissionCode } from '../../../api/types'
import TableMoves from './TableMoves'

const UNIR = { name: 'Unir otra mesa' }
const MUDAR = { name: 'Cambiar de mesa' }
const HORA = '2026-09-26T17:00:00Z'

function resumen(id: number, waiterId: number): ActiveOrderSummary {
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
    created_at: HORA,
    updated_at: HORA,
    status_changed_at: HORA,
  }
}

const SALON = [
  mesa({ id: 3, label: '3', status: 'occupied', active_order: resumen(12, 7) }),
  mesa({ id: 4, label: '4' }),
  mesa({ id: 5, label: 'Terraza', status: 'occupied', active_order: resumen(20, 7) }),
  mesa({ id: 6, label: '6', status: 'occupied', active_order: resumen(21, 8) }),
]

function mover(permisos: readonly PermissionCode[] = PERMISOS_MESERO, order: OrderResponse = pedido()) {
  const api = servidor().on('get', '/tables', SALON)
  entrarComo(permisos)
  return { api, ...montar(<TableMoves order={order} />) }
}

describe('TableMoves', () => {
  it('cambiar de mesa ofrece solo las libres y muda el pedido', async () => {
    const { api, user } = mover()
    api.on('post', '/orders/12/move', pedido({ table_id: 4, table_label: '4' }))

    await user.click(screen.getByRole('button', MUDAR))
    const ventana = within(await screen.findByRole('dialog', MUDAR))
    await user.click(await ventana.findByRole('button', { name: 'Mesa 4' }))

    expect(ventana.queryByRole('button', { name: /Terraza/u })).not.toBeInTheDocument()
    expect(await screen.findByText('Pedido #34 ahora en Mesa 4.')).toBeInTheDocument()
    expect(api.llamadas('post', '/orders/12/move')[0]?.body).toEqual({ table_id: 4 })
  })

  it('el mesero solo une mesas suyas, y nunca la misma', async () => {
    const { api, user } = mover()
    api.on('post', '/orders/12/merge', pedido())

    await user.click(screen.getByRole('button', UNIR))
    const ventana = within(await screen.findByRole('dialog', { name: 'Unir otra mesa a esta' }))
    const terraza = await ventana.findByRole('button', { name: /Terraza/u })

    expect(terraza).toHaveTextContent('#120 · S/ 40.00')
    expect(ventana.queryByRole('button', { name: /Mesa 6/u })).not.toBeInTheDocument()
    expect(ventana.queryByRole('button', { name: /Mesa 3/u })).not.toBeInTheDocument()
    await user.click(terraza)
    expect(await screen.findByText('Mesas unidas en el pedido #34.')).toBeInTheDocument()
    expect(api.llamadas('post', '/orders/12/merge')[0]?.body).toEqual({ source_order_id: 20 })
  })

  it('el encargado puede unir mesas de cualquier mesero', async () => {
    const { user } = mover(PERMISOS_ENCARGADO)

    await user.click(screen.getByRole('button', UNIR))

    expect(await screen.findByRole('button', { name: /Mesa 6/u })).toBeInTheDocument()
  })

  it('sin otras mesas propias lo dice', async () => {
    const { api, user } = mover()
    api.on('get', '/tables', [SALON[0]])

    await user.click(screen.getByRole('button', UNIR))

    expect(await screen.findByText('No tienes otras mesas con pedido')).toBeInTheDocument()
  })

  it('con un pago hecho, o en la mesa de otro mesero, no se ofrece unir', () => {
    mover(PERMISOS_MESERO, pedido({ payments: [pago()] }))
    mover(PERMISOS_MESERO, pedido({ waiter_id: 8 }))

    expect(screen.queryByRole('button', UNIR)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', MUDAR)).toHaveLength(2)
  })
})
