import { describe, expect, it } from '@jest/globals'
import { screen, waitFor, within } from '@testing-library/react'

import { buildOrder, payment } from '#jest/fixtures/charge'
import { ErrorResponse, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, server, signInAs } from '#jest/harness'
import type { OrderResponse, PermissionCode, VoidedPaymentResponse } from '@/api/types'
import { OrderDetailView } from './OrderDetailView'

const ORDER = '/orders/12'
const VOID_YAPE = '/orders/12/payments/50/void'
const ANNUL_YAPE = { name: /^Anular el cobro de S\/\s?30\.00 en Yape$/u }
const SUBMIT = { name: 'Anular cobro' }
const WRONG_METHOD = 'Medio de pago equivocado'

const HALF_PAID = buildOrder({ payments: [payment()], paid_amount: '30.00', balance: '20.00' })
const YAPE_VOIDED: VoidedPaymentResponse = { ...payment(), voided_at: '2026-09-26T17:40:00Z', voided_by: 7, voided_by_name: 'Ana Torres', void_reason: WRONG_METHOD }
const AFTER_VOID = buildOrder({ voided_payments: [YAPE_VOIDED] })

function open(order: OrderResponse = HALF_PAID, permissions: readonly PermissionCode[] = PERMISSIONS_OWNER) {
  const api = server().on('get', ORDER, order).on('get', '/cash/current', { is_open: true, session: null })
  signInAs(permissions)
  return { api, ...mountScreen(<OrderDetailView />, { path: '/pedidos/:orderId', en: '/pedidos/12' }) }
}

describe('detalle del pedido: anular un cobro (RFS-25)', () => {
  it('sin el permiso de caja no se ofrece', async () => {
    open(HALF_PAID, PERMISSIONS_WAITER)

    expect(await screen.findByRole('region', { name: 'Pagos registrados' })).toBeInTheDocument()
    expect(screen.queryByRole('button', ANNUL_YAPE)).not.toBeInTheDocument()
  })

  it('exige un motivo y deja el cobro tachado con quién y por qué', async () => {
    const { api, user } = open()
    api.on('post', VOID_YAPE, () => {
      api.on('get', ORDER, AFTER_VOID)
      return AFTER_VOID
    })

    await user.click(await screen.findByRole('button', ANNUL_YAPE))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', SUBMIT))
    expect(api.calls('post', VOID_YAPE)).toHaveLength(0)

    await user.click(within(dialog).getByRole('button', { name: WRONG_METHOD }))
    await user.click(within(dialog).getByRole('button', SUBMIT))

    await waitFor(() => {
      expect(api.calls('post', VOID_YAPE)[0]?.body).toEqual({ reason: WRONG_METHOD })
    })
    const voided = await screen.findByRole('region', { name: 'Cobros anulados' })
    expect(within(voided).getByText(/por Ana Torres: Medio de pago equivocado$/u)).toBeInTheDocument()
  })

  it('un cobro de un turno ya cerrado lo explica', async () => {
    const { api, user } = open()
    api.on('post', VOID_YAPE, new ErrorResponse(409, 'El turno se cerró.', 'payment_not_voidable'))

    await user.click(await screen.findByRole('button', ANNUL_YAPE))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cobro duplicado' }))
    await user.click(within(dialog).getByRole('button', SUBMIT))

    expect(await within(dialog).findByText('Ese cobro es de un turno de caja que ya se cerró: su arqueo no se cambia.')).toBeInTheDocument()
  })
})
