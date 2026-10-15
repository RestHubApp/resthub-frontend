import { describe, expect, it } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { buildOrder, dish, payment } from '#jest/fixtures/charge'
import { signInAs, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, ErrorResponse, server } from '#jest/harness'
import type { OrderResponse, PermissionCode } from '@/api/types'
import { OrderDetailView } from './OrderDetailView'

const ORDER = '/orders/12'
const VOID_LOMO = '/orders/12/items/1/void'
const ANNUL_LOMO = { name: 'Anular Lomo saltado' }
const VOIDED_AT = '2026-09-26T17:40:00Z'
const CHICHA_NAME = 'Chicha morada'
const WAITER_ERROR = 'Error del mesero'
const NO_STOCK = 'Sin insumo'
const SUBMIT = { name: 'Anular plato' }

const LOMO = dish({ kitchen_round: 1 })
const CHICHA = dish({ id: 2, menu_item_id: 11, name: CHICHA_NAME, unit_price: '20.00', subtotal: '20.00', kitchen_round: 2 })
const IN_KITCHEN = buildOrder({ status: 'in_kitchen', status_label: 'En cocina', kitchen_round: 2, items: [LOMO, CHICHA] })

function withLomoVoided(order: OrderResponse, reason: string): OrderResponse {
  return {
    ...order,
    items: order.items.map((item) => (item.id === LOMO.id ? { ...item, voided_at: VOIDED_AT, void_reason: reason } : item)),
    total: '20.00',
    balance: '20.00',
  }
}

function open(order: OrderResponse = IN_KITCHEN, permissions: readonly PermissionCode[] = PERMISSIONS_OWNER) {
  const api = server().on('get', ORDER, order).on('get', '/cash/current', { is_open: true, session: null })
  signInAs(permissions)
  return { api, ...mountScreen(<OrderDetailView />, { path: '/pedidos/:orderId', en: '/pedidos/12' }) }
}

describe('detalle del pedido: rondas', () => {
  it('lo agregado en la última ronda va aparte, con «Nuevo», y lo anterior queda en «Ya enviados»', async () => {
    open()

    const added = await screen.findByRole('region', { name: 'Agregado (ronda 2) Nuevo' })
    expect(within(added).getByText(CHICHA_NAME)).toBeInTheDocument()
    expect(within(added).queryByText('Lomo saltado')).not.toBeInTheDocument()
    expect(screen.getByText('Ya enviados (1)')).toBeInTheDocument()
  })
})

describe('detalle del pedido: anular un plato', () => {
  it('el mesero no ve «Anular»', async () => {
    open(IN_KITCHEN, PERMISSIONS_WAITER)

    expect(await screen.findByText(CHICHA_NAME)).toBeInTheDocument()
    expect(screen.queryByRole('button', ANNUL_LOMO)).not.toBeInTheDocument()
  })

  it('con pagos, ni en «abierto», no se ofrece', async () => {
    open(buildOrder({ status: 'in_kitchen', kitchen_round: 1, payments: [payment()] }))
    expect(await screen.findByText(CHICHA_NAME)).toBeInTheDocument()
    expect(screen.queryByRole('button', ANNUL_LOMO)).not.toBeInTheDocument()
  })

  it('exige un motivo, acepta uno rápido y muestra el plato tachado con su motivo', async () => {
    const { api, user } = open()
    const voided = withLomoVoided(IN_KITCHEN, WAITER_ERROR)
    api.on('post', VOID_LOMO, () => {
      api.on('get', ORDER, voided)
      return voided
    })

    await user.click(await screen.findByRole('button', ANNUL_LOMO))
    const dialog = within(await screen.findByRole('dialog', { name: '¿Anular 1 × Lomo saltado?' }))
    await user.click(dialog.getByRole('button', SUBMIT))
    expect(await dialog.findByText('Escribe el motivo')).toBeInTheDocument()
    expect(api.calls('post', VOID_LOMO)).toHaveLength(0)

    await user.click(dialog.getByRole('button', { name: WAITER_ERROR }))
    await user.click(dialog.getByRole('button', SUBMIT))

    expect(await screen.findByText('Lomo saltado anulado.')).toBeInTheDocument()
    expect(api.calls('post', VOID_LOMO)[0]?.body).toEqual({ reason: WAITER_ERROR })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(`Anulado: ${WAITER_ERROR}`)).toBeInTheDocument()
    expect(screen.queryByRole('button', ANNUL_LOMO)).not.toBeInTheDocument()
  })

  it('si el pedido ya tiene pagos, lo dice en simple y no cierra la ventana', async () => {
    const { api, user } = open()
    api.on('post', VOID_LOMO, new ErrorResponse(409, 'The order has payments.', 'order_has_payments'))

    await user.click(await screen.findByRole('button', ANNUL_LOMO))
    await user.type(await screen.findByLabelText('Motivo'), NO_STOCK)
    await user.click(screen.getByRole('button', SUBMIT))

    const dialog = within(screen.getByRole('dialog'))
    expect(await dialog.findByText('El pedido ya tiene pagos: ya no se puede anular un plato.')).toBeInTheDocument()
  })

  it('si ya estaba anulado, lo avisa y relee el pedido', async () => {
    const { api, user } = open()
    api.on('post', VOID_LOMO, () => {
      api.on('get', ORDER, withLomoVoided(IN_KITCHEN, NO_STOCK))
      return new ErrorResponse(409, 'x', 'item_already_voided')
    })

    await user.click(await screen.findByRole('button', ANNUL_LOMO))
    await user.type(await screen.findByLabelText('Motivo'), NO_STOCK)
    await user.click(screen.getByRole('button', SUBMIT))

    expect(await screen.findByText('Ese plato ya estaba anulado. El pedido se actualizó.')).toBeInTheDocument()
    expect(await screen.findByText(`Anulado: ${NO_STOCK}`)).toBeInTheDocument()
    expect(api.calls('get', ORDER).length).toBeGreaterThan(1)
  })

  it('al anular el último plato vigente sugiere cancelar el pedido', async () => {
    const only = buildOrder({ status: 'in_kitchen', kitchen_round: 1, items: [LOMO], item_count: 1 })
    const { api, user } = open(only)
    api.on('post', VOID_LOMO, withLomoVoided(only, 'Cliente cambió de opinión'))

    await user.click(await screen.findByRole('button', ANNUL_LOMO))
    await user.click(await screen.findByRole('button', { name: 'Cliente cambió de opinión' }))
    await user.click(screen.getByRole('button', SUBMIT))

    const dialog = within(await screen.findByRole('dialog', { name: 'Ya no queda ningún plato' }))
    await user.click(dialog.getByRole('button', { name: 'Cancelar pedido' }))

    expect(await screen.findByRole('dialog', { name: '¿Cancelar el pedido #34?' })).toBeInTheDocument()
  })
})
