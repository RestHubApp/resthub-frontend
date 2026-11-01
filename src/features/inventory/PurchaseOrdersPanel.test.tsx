import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { purchaseOrder } from '#jest/fixtures/inventory'
import { ErrorResponse, mountScreen, server, signInAs, withoutResponse } from '#jest/harness'
import { PurchaseOrdersPanel } from './PurchaseOrdersPanel'

const ORDERS = '/inventory/purchase-orders'
const CANCEL = `${ORDERS}/1/cancel`
const SENT = purchaseOrder({ id: 1, number: 1, status: 'sent', status_label: 'Enviada' })
const CANCEL_ORDER = { name: 'Cancelar orden' }

function open() {
  const api = server().on('get', ORDERS, { items: [SENT], total: 1 })
  signInAs()
  return { api, ...mountScreen(<PurchaseOrdersPanel canManage />) }
}

describe('PurchaseOrdersPanel', () => {
  it('cancelar una orden pide confirmación y solo se envía al confirmar', async () => {
    const { api, user } = open()
    api.on('post', CANCEL, { ...SENT, status: 'cancelled', status_label: 'Cancelada' })

    await user.click(await screen.findByRole('button', CANCEL_ORDER))
    const confirmation = await screen.findByRole('alertdialog', { name: '¿Cancelar la OC 1?' })
    expect(api.calls('post', CANCEL)).toHaveLength(0)
    await user.click(within(confirmation).getByRole('button', { name: 'Volver' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(api.calls('post', CANCEL)).toHaveLength(0)

    await user.click(screen.getByRole('button', CANCEL_ORDER))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', CANCEL_ORDER))

    expect(await screen.findByText('Orden 1: cancelada.')).toBeInTheDocument()
    expect(api.calls('post', CANCEL)).toHaveLength(1)
  })

  it('si otro ya cambió la orden, el rechazo relee la lista y la tarjeta deja de ofrecer acciones', async () => {
    const { api, user } = open()
    api.on('post', CANCEL, () => {
      api.on('get', ORDERS, { items: [{ ...SENT, status: 'received', status_label: 'Recibida' }], total: 1 })
      return new ErrorResponse(422, 'Una orden «Recibida» ya no se cancela.')
    })

    await user.click(await screen.findByRole('button', CANCEL_ORDER))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', CANCEL_ORDER))

    expect(await screen.findByText('Una orden «Recibida» ya no se cancela.')).toBeInTheDocument()
    expect(await screen.findByText('Recibida')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Recibir' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', CANCEL_ORDER)).not.toBeInTheDocument()
    expect(api.calls('get', ORDERS)).toHaveLength(2)
  })

  it('mientras se marca enviada, «Recibir» queda bloqueado', async () => {
    const { api, user } = open()
    api.on('get', ORDERS, { items: [{ ...SENT, status: 'draft', status_label: 'Borrador' }], total: 1 })
    api.on('post', `${ORDERS}/1/send`, withoutResponse)

    await user.click(await screen.findByRole('button', { name: 'Marcar enviada' }))

    expect(screen.getByRole('button', { name: 'Recibir' })).toBeDisabled()
  })
})
