import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { pedido } from '#jest/fixtures/cobro'
import { entrarComo, montar, servidor } from '#jest/harness'
import type { OrderResponse } from '../../api/types'
import CancelOrderDialog from './CancelOrderDialog'

const CANCELAR = '/orders/12/cancel'

function cancelar(order: OrderResponse | null = pedido()) {
  const api = servidor().on('post', CANCELAR, pedido({ status: 'cancelled' }))
  entrarComo()
  const onClose = jest.fn()
  return { api, onClose, ...montar(<CancelOrderDialog order={order} onClose={onClose} />) }
}

describe('CancelOrderDialog', () => {
  it('en mesa avisa que la mesa queda libre y exige un motivo', async () => {
    const { api, user } = cancelar()

    const ventana = within(await screen.findByRole('dialog', { name: '¿Cancelar el pedido #34?' }))
    expect(ventana.getByText('Mesa 3. La mesa queda libre y el pedido pasa al historial como cancelado.')).toBeInTheDocument()
    await user.click(ventana.getByRole('button', { name: 'Cancelar pedido' }))

    expect(await ventana.findByText('Escribe el motivo')).toBeInTheDocument()
    expect(api.llamadas('post', CANCELAR)).toHaveLength(0)
  })

  it('con el motivo, cancela, avisa y cierra', async () => {
    const { api, onClose, user } = cancelar()

    await user.type(await screen.findByLabelText('Motivo'), '  Pedido duplicado  ')
    await user.click(screen.getByRole('button', { name: 'Cancelar pedido' }))

    expect(await screen.findByText('Pedido #34 cancelado.')).toBeInTheDocument()
    expect(api.llamadas('post', CANCELAR)[0]?.body).toEqual({ reason: 'Pedido duplicado' })
    expect(onClose).toHaveBeenCalled()
  })

  it('para llevar no habla de mesas', async () => {
    cancelar(pedido({ type: 'takeaway', table_label: null, customer_name: 'Rosa' }))

    expect(await screen.findByText('Para llevar · Rosa. El pedido pasa al historial como cancelado.')).toBeInTheDocument()
  })

  it('«Volver» cierra sin cancelar', async () => {
    const { api, onClose, user } = cancelar()

    await user.click(await screen.findByRole('button', { name: 'Volver' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(api.llamadas('post', CANCELAR)).toHaveLength(0)
  })

  it('Escape descarta el motivo escrito y cierra', async () => {
    const { onClose, user } = cancelar()

    await user.type(await screen.findByLabelText('Motivo'), 'Se fue')
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sin pedido no hay ventana', () => {
    cancelar(null)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
