import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { purchaseOrder } from '#jest/fixtures/inventory'
import { mountScreen, server, signInAs } from '#jest/harness'
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
})
