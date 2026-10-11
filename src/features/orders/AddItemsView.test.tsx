import { afterEach, describe, expect, it } from '@jest/globals'
import { act, renderHook, screen } from '@testing-library/react'

import { handleMenu, order, lastBody } from '#jest/fixtures/pedidos'
import { signInAs, handleMount, server } from '#jest/harness'
import { AddItemsView } from './AddItemsView'
import { useDraftActions } from './taking/useOrderDraft'

function open(actual = order({ status: 'served', status_label: 'Servido, por cobrar' })) {
  const api = server()
    .on('get', '/orders/5', actual)
    .on('get', '/menu', handleMenu())
    .on('post', '/orders/5/items', order({ status: 'in_kitchen' }))
  signInAs()
  return { api, ...handleMount(<AddItemsView />, { path: '/pedidos/:orderId/agregar', en: '/pedidos/5/agregar' }) }
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
    expect(lastBody(api.calls('post', '/orders/5/items'))).toEqual({
      items: [{ menu_item_id: 12, quantity: 1, notes: '', modifiers: [] }],
    })
    expect(await screen.findByRole('status', { name: 'Ruta actual' })).toHaveTextContent('/pedidos/5')
  })

  it('un pedido ya pagado avisa que no admite más platos', async () => {
    open(order({ status: 'paid', status_label: 'Pagado' }))
    expect(await screen.findByText('Este pedido ya está pagado: no admite más platos.')).toBeInTheDocument()
  })
})
