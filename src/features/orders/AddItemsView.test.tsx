import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook, screen, waitFor } from '@testing-library/react'

import { buildMenu, order, lastBody } from '#jest/fixtures/orders'
import { signInAs, mountScreen, server, withoutNetwork } from '#jest/harness'
import { AddItemsView } from './AddItemsView'
import { useDraftActions } from './taking/useOrderDraft'

const ITEMS = '/orders/5/items'

function open(actual = order({ status: 'served', status_label: 'Servido, por cobrar' })) {
  const api = server()
    .on('get', '/orders/5', actual)
    .on('get', '/menu', buildMenu())
    .on('post', ITEMS, order({ status: 'in_kitchen' }))
  signInAs()
  return { api, ...mountScreen(<AddItemsView />, { path: '/pedidos/:orderId/agregar', en: '/pedidos/5/agregar' }) }
}

afterEach(() => {
  const { result } = renderHook(() => useDraftActions())
  act(() => {
    result.current.clear('pedido-5')
  })
})

describe('AddItemsView', () => {
  it('agrega platos al pedido existente y vuelve a su detalle', async () => {
    const { api, user } = open()
    expect(await screen.findByRole('heading', { name: 'Pedido #12 · Mesa 3', level: 1 })).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: /Ají de gallina/u }))
    await user.click(screen.getByRole('button', { name: /agregar al pedido/i }))

    expect(await screen.findByText('Platos agregados al pedido #12.')).toBeInTheDocument()
    expect(lastBody(api.calls('post', ITEMS))).toEqual({
      items: [{ menu_item_id: 12, quantity: 1, notes: '', modifiers: [] }],
    })
    expect(await screen.findByRole('status', { name: 'Ruta actual' })).toHaveTextContent('/pedidos/5')
  })

  it('sin respuesta al agregar, avisa que pudo haber llegado y relee el pedido', async () => {
    const { api, user } = open()
    api.on('post', ITEMS, withoutNetwork)
    expect(await screen.findByRole('heading', { name: 'Pedido #12 · Mesa 3', level: 1 })).toBeInTheDocument()
    const reads = api.calls('get', '/orders/5').length

    await user.click(await screen.findByRole('button', { name: /Ají de gallina/u }))
    await user.click(screen.getByRole('button', { name: /agregar al pedido/i }))

    expect(
      await screen.findByText('No se confirmó si se agregaron los platos: revisa el pedido antes de reintentar.'),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(api.calls('get', '/orders/5').length).toBeGreaterThan(reads)
    })
    expect(api.calls('post', ITEMS)).toHaveLength(1)
  })

  it('un pedido ya pagado avisa que no admite más platos', async () => {
    open(order({ status: 'paid', status_label: 'Pagado' }))
    expect(await screen.findByText('Este pedido ya está pagado: no admite más platos.')).toBeInTheDocument()
  })
})
