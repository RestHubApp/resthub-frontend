import { describe, expect, it } from '@jest/globals'
import { waitFor } from '@testing-library/react'

import { mesa, pedidoEnMesa } from '#jest/fixtures/inventario'
import { entrarComo, PERMISOS_MESERO, servidor } from '#jest/harness'
import type { TableResponse } from '../../api/types'
import { prefetchTables } from './prefetchTables'
import { withOrder, withTable } from './tableCache'

function respuesta(cambios: Partial<TableResponse> = {}): TableResponse {
  return { id: 1, label: '1', position: 0, is_active: true, created_at: '2026-09-26T13:00:00Z', ...cambios }
}

describe('withTable', () => {
  it('una mesa existente conserva su estado y su pedido al renombrarse', () => {
    const ocupada = mesa({ status: 'occupied', status_label: 'Ocupada', active_order: pedidoEnMesa(4) })
    const [actualizada] = withTable([ocupada], respuesta({ label: 'Ventana' }))
    expect(actualizada).toMatchObject({ label: 'Ventana', status: 'occupied', active_order: { number: 4 } })
  })

  it('una mesa nueva entra libre y al final', () => {
    const lista = withTable([mesa()], respuesta({ id: 5, label: 'Barra', position: 1 }))
    expect(lista.map((m) => m.id)).toEqual([1, 5])
    expect(lista[1]).toMatchObject({ status: 'free', status_label: 'Libre', active_order: null })
  })
})

describe('withOrder', () => {
  it('sigue el orden que confirmó el servidor y descarta lo que no conoce', () => {
    const lista = withOrder(
      [mesa({ id: 1 }), mesa({ id: 2, label: '2' })],
      [respuesta({ id: 2, label: '2', position: 0 }), respuesta({ id: 1, position: 1 }), respuesta({ id: 99 })],
    )
    expect(lista.map((m) => [m.id, m.position])).toEqual([
      [2, 0],
      [1, 1],
    ])
  })
})

describe('prefetchTables', () => {
  it('quien administra las mesas las pide por adelantado, con las desactivadas', async () => {
    const api = servidor().on('get', '/tables', [])
    entrarComo()
    prefetchTables()
    await waitFor(() => {
      expect(api.llamadas('get', '/tables')).toHaveLength(1)
    })
    expect(api.llamadas('get', '/tables')[0]?.params).toEqual({ include_inactive: true })
  })

  it('el mesero no las pide: el servidor respondería 403', () => {
    const api = servidor()
    entrarComo(PERMISOS_MESERO)
    prefetchTables()
    expect(api.peticiones).toHaveLength(0)
  })
})
