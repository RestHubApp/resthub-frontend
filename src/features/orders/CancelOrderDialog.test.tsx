import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { handleOrder } from '#jest/fixtures/charge'
import { signInAs, handleMount, server } from '#jest/harness'
import type { OrderResponse } from '@/api/types'
import { CancelOrderDialog } from './CancelOrderDialog'

const CANCEL = '/orders/12/cancel'

function cancel(order: OrderResponse | null = handleOrder()) {
  const api = server().on('post', CANCEL, handleOrder({ status: 'cancelled' }))
  signInAs()
  const onClose = jest.fn()
  return { api, onClose, ...handleMount(<CancelOrderDialog order={order} onClose={onClose} />) }
}

describe('CancelOrderDialog', () => {
  it('en mesa avisa que la mesa queda libre y exige un motivo', async () => {
    const { api, user } = cancel()

    const window = within(await screen.findByRole('dialog', { name: '¿Cancelar el pedido #34?' }))
    expect(window.getByText('Mesa 3. La mesa queda libre y el pedido pasa al historial como cancelado.')).toBeInTheDocument()
    await user.click(window.getByRole('button', { name: 'Cancelar pedido' }))

    expect(await window.findByText('Escribe el motivo')).toBeInTheDocument()
    expect(api.calls('post', CANCEL)).toHaveLength(0)
  })

  it('con el motivo, cancela, avisa y cierra', async () => {
    const { api, onClose, user } = cancel()

    await user.type(await screen.findByLabelText('Motivo'), '  Pedido duplicado  ')
    await user.click(screen.getByRole('button', { name: 'Cancelar pedido' }))

    expect(await screen.findByText('Pedido #34 cancelado.')).toBeInTheDocument()
    expect(api.calls('post', CANCEL)[0]?.body).toEqual({ reason: 'Pedido duplicado' })
    expect(onClose).toHaveBeenCalled()
  })

  it('para llevar no habla de mesas', async () => {
    cancel(handleOrder({ type: 'takeaway', table_label: null, customer_name: 'Rosa' }))

    expect(await screen.findByText('Para llevar · Rosa. El pedido pasa al historial como cancelado.')).toBeInTheDocument()
  })

  it('«Volver» cierra sin cancelar', async () => {
    const { api, onClose, user } = cancel()

    await user.click(await screen.findByRole('button', { name: 'Volver' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(api.calls('post', CANCEL)).toHaveLength(0)
  })

  it('Escape descarta el motivo escrito y cierra', async () => {
    const { onClose, user } = cancel()

    await user.type(await screen.findByLabelText('Motivo'), 'Se fue')
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sin pedido no hay ventana', () => {
    cancel(null)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
