import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { paid, payment, buildOrder, dish } from '#jest/fixtures/charge'
import { signInAs, mountScreen, server, type Request } from '#jest/harness'
import type { OrderResponse } from '@/api/types'
import { ChargeDialog } from './ChargeDialog'

const PAYMENTS = '/orders/12/payments'
const CONFIRM = { name: 'Confirmar pago' }
const EQUAL = { name: 'Partes iguales' }

// Tras un pago parcial, el pedido baja su saldo; con el último, queda pagado.
function after(actual: OrderResponse, amount: string): OrderResponse {
  const fresh = payment({ id: 50 + actual.payments.length, amount })
  const balance = (Number(actual.balance) - Number(amount)).toFixed(2)
  if (balance === '0.00') {
    return paid(actual, fresh)
  }
  return { ...actual, payments: [...actual.payments, fresh], paid_amount: amount, balance }
}

function amountOf(request: Request, actual: OrderResponse): string {
  const body = request.body as { amount?: string; item_ids?: number[] }
  if (body.item_ids) {
    const selected = actual.items.filter((item) => body.item_ids?.includes(item.id) === true)
    return selected.reduce((sum, item) => sum + Number(item.subtotal), 0).toFixed(2)
  }
  return body.amount ?? actual.balance
}

function chargeSplit(initial: OrderResponse = buildOrder()) {
  let actual = initial
  const api = server()
    .on('get', '/cash/current', { is_open: true, session: null })
    .on('get', '/orders/12', () => actual)
    .on('post', PAYMENTS, (request: Request) => {
      actual = after(actual, amountOf(request, actual))
      return actual
    })
  signInAs()
  return { api, ...mountScreen(<ChargeDialog order={initial} onClose={jest.fn()} />) }
}

describe('cobro en partes iguales', () => {
  it('divide lo que falta entre dos y cobra la parte de cada uno', async () => {
    const { api, user } = chargeSplit()

    await user.click(await screen.findByRole('radio', EQUAL))
    expect(screen.getByTestId('equal-split-part')).toHaveTextContent(/Paga cada una\s*S\/ 25\.00/u)
    await user.click(screen.getByRole('radio', { name: 'Tarjeta' }))
    await user.click(screen.getByRole('button', CONFIRM))

    expect(await screen.findByText('Pago registrado. Faltan S/ 25.00.')).toBeInTheDocument()
    expect(api.calls('post', PAYMENTS)[0]?.body).toMatchObject({ amount: '25.00', payment_method: 'card', expected_balance: '50.00' })
    expect(await screen.findByText('Paga lo que falta')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Pagos registrados' })).getByText('S/ 25.00', { exact: false })).toBeInTheDocument()
  })

  it('la última persona paga lo que queda, sin monto parcial', async () => {
    const { api, user } = chargeSplit()

    await user.click(await screen.findByRole('radio', EQUAL))
    await user.click(screen.getByRole('button', { name: 'Uno menos de personas' }))
    expect(screen.getByText('Paga lo que falta')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Plin' }))
    await user.click(screen.getByRole('button', CONFIRM))

    await screen.findByRole('dialog', { name: 'Cobro registrado' })
    expect(api.calls('post', PAYMENTS)[0]?.body).not.toHaveProperty('amount')
  })

  it('entre tres, el redondeo queda para el último', async () => {
    const { user } = chargeSplit(buildOrder({ balance: '100.00', total: '100.00' }))

    await user.click(await screen.findByRole('radio', EQUAL))
    await user.click(screen.getByRole('button', { name: 'Uno más de personas' }))

    expect(screen.getByTestId('equal-split-part')).toHaveTextContent(/Paga cada una\s*S\/ 33\.33/u)
  })
})

describe('cobro por platos', () => {
  it('pide al menos un plato y cobra solo los elegidos', async () => {
    const { api, user } = chargeSplit()

    await user.click(await screen.findByRole('radio', { name: 'Por platos' }))
    expect(screen.getByText('Elige al menos un plato')).toBeInTheDocument()
    expect(screen.getByRole('button', CONFIRM)).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: /Chicha morada/u }))
    expect(screen.getByTestId('item-split-charge')).toHaveTextContent(/Paga, con el descuento del pedido\s*S\/ 20\.00/u)
    await user.click(screen.getByRole('radio', { name: 'Yape' }))
    await user.click(screen.getByRole('button', CONFIRM))

    expect(await screen.findByText('Pago registrado. Faltan S/ 30.00.')).toBeInTheDocument()
    expect(api.calls('post', PAYMENTS)[0]?.body).toMatchObject({ item_ids: [2], payment_method: 'yape' })
  })

  it('los platos ya pagados no se ofrecen y una cortesía no cuesta', async () => {
    const order = buildOrder({
      items: [
        dish({ is_paid: true }),
        dish({ id: 2, name: 'Chicha morada', subtotal: '20.00' }),
        dish({ id: 3, name: 'Postre', subtotal: '8.00', is_courtesy: true, courtesy_reason: 'Cumpleaños' }),
      ],
      paid_amount: '30.00',
      balance: '20.00',
      payments: [payment()],
    })
    const { user } = chargeSplit(order)

    await user.click(await screen.findByRole('radio', { name: 'Por platos' }))

    expect(screen.queryByRole('checkbox', { name: /Lomo saltado/u })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Postre/u })).toHaveAccessibleName(/cortesía/u)
    expect(screen.getByText('Falta cobrar')).toBeInTheDocument()
  })
})

describe('la cuenta', () => {
  it('muestra cortesías, descuento y lo ya pagado antes de lo que falta', async () => {
    chargeSplit(
      buildOrder({
        subtotal: '58.00',
        courtesy_amount: '8.00',
        discount_amount: '5.00',
        discount_percent: '10.00',
        paid_amount: '20.00',
        balance: '25.00',
        payments: [payment({ amount: '20.00', tip: '2.00' })],
      }),
    )

    expect(await screen.findByText('Cortesías')).toBeInTheDocument()
    expect(screen.getByText('Descuento 10.0 %')).toBeInTheDocument()
    expect(screen.getByText('Ya pagado')).toBeInTheDocument()
    expect(screen.getByTestId('bill-balance')).toHaveTextContent(/Falta cobrar\s*S\/ 25\.00/u)
    expect(screen.getByRole('region', { name: 'Pagos registrados' })).toHaveTextContent('+ S/ 2.00')
  })
})
