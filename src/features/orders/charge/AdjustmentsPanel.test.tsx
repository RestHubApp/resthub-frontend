import { describe, expect, it } from '@jest/globals'
import { screen } from '@testing-library/react'

import { payment, buildOrder, dish } from '#jest/fixtures/charge'
import { signInAs, mountScreen, PERMISSIONS_OWNER, PERMISSIONS_WAITER, firstOf, ErrorResponse, server } from '#jest/harness'
import type { OrderResponse } from '@/api/types'
import { AdjustmentsPanel } from './AdjustmentsPanel'

const DISCOUNT = '/orders/12/discount'
const COURTESY = '/orders/12/items/1/courtesy'
const INVITE_DISH = 'Invitar un plato (cortesía)'
const APPLY = { name: 'Aplicar descuento' }
const PERCENTAGE = 'Descuento %'
const REASON = 'Motivo'

function adjust(order: OrderResponse = buildOrder(), permissions = PERMISSIONS_WAITER) {
  const api = server()
    .on('get', '/restaurant', { max_waiter_discount_percent: '10.00' })
    .on('put', DISCOUNT, (request: { body: unknown }) => ({
      ...order,
      discount_percent: (request.body as { percent: string }).percent,
    }))
  signInAs(permissions)
  return { api, ...mountScreen(<AdjustmentsPanel order={order} />) }
}

describe('descuento del pedido', () => {
  it('el mesero ve su tope y el descuento viaja con punto decimal y motivo', async () => {
    const { api, user } = adjust()

    await user.click(screen.getByRole('button', APPLY))
    expect(await screen.findByText('Hasta 10.0 %; más, lo aplica el encargado.')).toBeInTheDocument()
    await user.type(screen.getByLabelText(PERCENTAGE), '7,5')
    await user.type(screen.getByLabelText(REASON), 'Cliente frecuente')
    await user.click(screen.getByRole('button', APPLY))

    expect(await screen.findByText('Descuento de 7.5 % aplicado.')).toBeInTheDocument()
    expect(api.calls('put', DISCOUNT)[0]?.body).toEqual({ percent: '7.5', reason: 'Cliente frecuente' })
    expect(screen.queryByLabelText(PERCENTAGE)).not.toBeInTheDocument()
  })

  it('el encargado descuenta sin tope y no consulta el del mesero', async () => {
    const { api, user } = adjust(buildOrder(), PERMISSIONS_OWNER)

    await user.click(screen.getByRole('button', APPLY))

    expect(screen.getByText('Sin tope: lo aplicas como encargado.')).toBeInTheDocument()
    expect(api.calls('get', '/restaurant')).toHaveLength(0)
  })

  it('valida el porcentaje y el motivo antes de enviar', async () => {
    const { api, user } = adjust()

    await user.click(screen.getByRole('button', APPLY))
    await user.type(screen.getByLabelText(PERCENTAGE), '150')
    await user.type(screen.getByLabelText(REASON), 'ok')
    await user.click(screen.getByRole('button', APPLY))

    expect(await screen.findByText('Como máximo 100 %. Revisa el dato')).toBeInTheDocument()
    expect(screen.getByText('Escribe el motivo (al menos 5 caracteres)')).toBeInTheDocument()
    expect(api.calls('put', DISCOUNT)).toHaveLength(0)
  })

  it('si el servidor rechaza el descuento del mesero, muestra por qué', async () => {
    const { api, user } = adjust()
    api.on('put', DISCOUNT, new ErrorResponse(403, 'Supera el tope del mesero.'))

    await user.click(screen.getByRole('button', APPLY))
    await user.type(screen.getByLabelText(PERCENTAGE), '20')
    await user.type(screen.getByLabelText(REASON), 'Demora en cocina')
    await user.click(screen.getByRole('button', APPLY))

    expect(await screen.findByText('Supera el tope del mesero.')).toBeInTheDocument()
  })

  it('con descuento se puede cambiar o quitar, y quitarlo envía cero', async () => {
    const { api, user } = adjust(buildOrder({ discount_amount: '5.00', discount_percent: '10.00' }))

    expect(screen.getByRole('button', { name: 'Cambiar descuento (10.0 %)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar descuento' }))

    expect(await screen.findByText('Descuento quitado.')).toBeInTheDocument()
    expect(api.calls('put', DISCOUNT)[0]?.body).toEqual({ percent: '0', reason: '' })
  })

  it('después del primer pago ya no se puede ajustar la cuenta', () => {
    adjust(buildOrder({ payments: [payment()] }), PERMISSIONS_OWNER)

    expect(screen.queryByRole('region', { name: 'Descuentos y cortesías' })).not.toBeInTheDocument()
  })
})

describe('cortesías', () => {
  it('solo quien descuenta sin tope puede invitar un plato', () => {
    adjust()

    expect(screen.queryByText(INVITE_DISH)).not.toBeInTheDocument()
  })

  it('invitar pide un motivo de al menos cinco letras', async () => {
    const { api, user } = adjust(buildOrder(), PERMISSIONS_OWNER)
    api.on('put', COURTESY, buildOrder())

    await user.click(screen.getByText(INVITE_DISH))
    await user.click(firstOf(screen.getAllByRole('button', { name: 'Invitar' })))
    const reason = screen.getByLabelText('Motivo de la cortesía de Lomo saltado')
    await user.type(reason, 'Cump')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
    await user.type(reason, 'leaños ')
    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText(INVITE_DISH)).toBeInTheDocument()
    expect(api.calls('put', COURTESY)[0]?.body).toEqual({ reason: 'Cumpleaños' })
  })

  it('un plato invitado muestra el motivo y se puede volver a cobrar', async () => {
    const invited = dish({ is_courtesy: true, courtesy_reason: 'Error de cocina' })
    const { api, user } = adjust(buildOrder({ items: [invited] }), PERMISSIONS_OWNER)
    api.on('delete', COURTESY, buildOrder())

    expect(screen.getByText('Invita la casa: Error de cocina')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cobrar' }))

    expect(api.calls('delete', COURTESY)).toHaveLength(1)
  })

  it('un plato anulado no aparece entre los que se pueden invitar', async () => {
    const voided = dish({ voided_at: '2026-09-26T17:40:00Z', void_reason: 'Sin insumo' })
    const chicha = dish({ id: 2, name: 'Chicha morada' })
    const { user } = adjust(buildOrder({ items: [voided, chicha] }), PERMISSIONS_OWNER)

    await user.click(screen.getByText(INVITE_DISH))

    expect(screen.getAllByRole('button', { name: 'Invitar' })).toHaveLength(1)
    expect(screen.getByText(/Chicha morada/u)).toBeInTheDocument()
    expect(screen.queryByText(/Lomo saltado/u)).not.toBeInTheDocument()
  })
})
