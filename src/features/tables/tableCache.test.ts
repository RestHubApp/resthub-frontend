import { describe, expect, it } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import { table, orderInTable } from '#jest/fixtures/inventory'
import { signInAs, PERMISSIONS_WAITER, server } from '#jest/harness'
import type { TableResponse } from '@/api/types'
import { prefetchTables } from './prefetchTables'
import { withOrder, withTable } from './tableCache'

function response(changes: Partial<TableResponse> = {}): TableResponse {
  return { id: 1, label: '1', position: 0, is_active: true, created_at: '2026-09-26T13:00:00Z', ...changes }
}

describe('withTable', () => {
  it('una mesa existente conserva su estado y su pedido al renombrarse', () => {
    const occupied = table({ status: 'occupied', status_label: 'Ocupada', active_order: orderInTable(4) })
    const [updated] = withTable([occupied], response({ label: 'Ventana' }))
    expect(updated).toMatchObject({ label: 'Ventana', status: 'occupied', active_order: { number: 4 } })
  })

  it('una mesa nueva entra libre y al final', () => {
    const list = withTable([table()], response({ id: 5, label: 'Barra', position: 1 }))
    expect(list.map((m) => m.id)).toEqual([1, 5])
    expect(list[1]).toMatchObject({ status: 'free', status_label: 'Libre', active_order: null })
  })
})

describe('withOrder', () => {
  it('sigue el orden que confirmó el servidor y descarta lo que no conoce', () => {
    const list = withOrder(
      [table({ id: 1 }), table({ id: 2, label: '2' })],
      [response({ id: 2, label: '2', position: 0 }), response({ id: 1, position: 1 }), response({ id: 99 })],
    )
    expect(list.map((m) => [m.id, m.position])).toEqual([
      [2, 0],
      [1, 1],
    ])
  })
})

describe('prefetchTables', () => {
  it('quien administra las mesas las pide por adelantado, con las desactivadas', async () => {
    const api = server().on('get', '/tables', [])
    signInAs()
    prefetchTables()
    await waitFor(() => {
      expect(api.calls('get', '/tables')).toHaveLength(1)
    })
    expect(api.calls('get', '/tables')[0]?.params).toEqual({ include_inactive: 'true' })
  })

  it('el mesero no las pide: el servidor respondería 403', () => {
    const api = server()
    signInAs(PERMISSIONS_WAITER)
    prefetchTables()
    expect(api.requests).toHaveLength(0)
  })
})
