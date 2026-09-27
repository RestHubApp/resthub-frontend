import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { pagado, pago, pedido, plato } from '#jest/fixtures/cobro'
import { entrarComo, montar, servidor, type Peticion } from '#jest/harness'
import type { OrderResponse } from '../../../api/types'
import ChargeDialog from './ChargeDialog'

const PAGOS = '/orders/12/payments'
const CONFIRMAR = { name: 'Confirmar pago' }
const IGUALES = { name: 'Partes iguales' }

// Tras un pago parcial, el pedido baja su saldo; con el último, queda pagado.
function tras(actual: OrderResponse, monto: string): OrderResponse {
  const nuevo = pago({ id: 50 + actual.payments.length, amount: monto })
  const saldo = (Number(actual.balance) - Number(monto)).toFixed(2)
  if (saldo === '0.00') {
    return pagado(actual, nuevo)
  }
  return { ...actual, payments: [...actual.payments, nuevo], paid_amount: monto, balance: saldo }
}

function montoDe(peticion: Peticion, actual: OrderResponse): string {
  const cuerpo = peticion.body as { amount?: string; item_ids?: number[] }
  if (cuerpo.item_ids) {
    const elegidos = actual.items.filter((item) => cuerpo.item_ids?.includes(item.id))
    return elegidos.reduce((suma, item) => suma + Number(item.subtotal), 0).toFixed(2)
  }
  return cuerpo.amount ?? actual.balance
}

function cobrarDividido(inicial: OrderResponse = pedido()) {
  let actual = inicial
  const api = servidor()
    .on('get', '/cash/current', { is_open: true, session: null })
    .on('get', '/orders/12', () => actual)
    .on('post', PAGOS, (peticion: Peticion) => {
      actual = tras(actual, montoDe(peticion, actual))
      return actual
    })
  entrarComo()
  return { api, ...montar(<ChargeDialog order={inicial} onClose={jest.fn()} />) }
}

describe('cobro en partes iguales', () => {
  it('divide lo que falta entre dos y cobra la parte de cada uno', async () => {
    const { api, user } = cobrarDividido()

    await user.click(await screen.findByRole('radio', IGUALES))
    expect(screen.getByText('Paga cada una').nextSibling).toHaveTextContent('S/ 25.00')
    await user.click(screen.getByRole('radio', { name: 'Tarjeta' }))
    await user.click(screen.getByRole('button', CONFIRMAR))

    expect(await screen.findByText('Pago registrado. Faltan S/ 25.00.')).toBeInTheDocument()
    expect(api.llamadas('post', PAGOS)[0]?.body).toMatchObject({ amount: '25.00', payment_method: 'card', expected_balance: '50.00' })
    expect(await screen.findByText('Paga lo que falta')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Pagos registrados' })).getByText('S/ 25.00', { exact: false })).toBeInTheDocument()
  })

  it('la última persona paga lo que queda, sin monto parcial', async () => {
    const { api, user } = cobrarDividido()

    await user.click(await screen.findByRole('radio', IGUALES))
    await user.click(screen.getByRole('button', { name: 'Uno menos de personas' }))
    expect(screen.getByText('Paga lo que falta')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Plin' }))
    await user.click(screen.getByRole('button', CONFIRMAR))

    await screen.findByRole('dialog', { name: 'Cobro registrado' })
    expect(api.llamadas('post', PAGOS)[0]?.body).not.toHaveProperty('amount')
  })

  it('entre tres, el redondeo queda para el último', async () => {
    const { user } = cobrarDividido(pedido({ balance: '100.00', total: '100.00' }))

    await user.click(await screen.findByRole('radio', IGUALES))
    await user.click(screen.getByRole('button', { name: 'Uno más de personas' }))

    expect(screen.getByText('Paga cada una').nextSibling).toHaveTextContent('S/ 33.33')
  })
})

describe('cobro por platos', () => {
  it('pide al menos un plato y cobra solo los elegidos', async () => {
    const { api, user } = cobrarDividido()

    await user.click(await screen.findByRole('radio', { name: 'Por platos' }))
    expect(screen.getByText('Elige al menos un plato')).toBeInTheDocument()
    expect(screen.getByRole('button', CONFIRMAR)).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: /Chicha morada/u }))
    expect(screen.getByText('Paga, con el descuento del pedido').nextSibling).toHaveTextContent('S/ 20.00')
    await user.click(screen.getByRole('radio', { name: 'Yape' }))
    await user.click(screen.getByRole('button', CONFIRMAR))

    expect(await screen.findByText('Pago registrado. Faltan S/ 30.00.')).toBeInTheDocument()
    expect(api.llamadas('post', PAGOS)[0]?.body).toMatchObject({ item_ids: [2], payment_method: 'yape' })
  })

  it('los platos ya pagados no se ofrecen y una cortesía no cuesta', async () => {
    const orden = pedido({
      items: [
        plato({ is_paid: true }),
        plato({ id: 2, name: 'Chicha morada', subtotal: '20.00' }),
        plato({ id: 3, name: 'Postre', subtotal: '8.00', is_courtesy: true, courtesy_reason: 'Cumpleaños' }),
      ],
      paid_amount: '30.00',
      balance: '20.00',
      payments: [pago()],
    })
    const { user } = cobrarDividido(orden)

    await user.click(await screen.findByRole('radio', { name: 'Por platos' }))

    expect(screen.queryByRole('checkbox', { name: /Lomo saltado/u })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Postre/u })).toHaveAccessibleName(/cortesía/u)
    expect(screen.getByText('Falta cobrar')).toBeInTheDocument()
  })
})

describe('la cuenta', () => {
  it('muestra cortesías, descuento y lo ya pagado antes de lo que falta', async () => {
    cobrarDividido(
      pedido({
        subtotal: '58.00',
        courtesy_amount: '8.00',
        discount_amount: '5.00',
        discount_percent: '10.00',
        paid_amount: '20.00',
        balance: '25.00',
        payments: [pago({ amount: '20.00', tip: '2.00' })],
      }),
    )

    expect(await screen.findByText('Cortesías')).toBeInTheDocument()
    expect(screen.getByText('Descuento 10.0 %')).toBeInTheDocument()
    expect(screen.getByText('Ya pagado')).toBeInTheDocument()
    expect(screen.getByText('Falta cobrar').nextSibling).toHaveTextContent('S/ 25.00')
    expect(screen.getByRole('region', { name: 'Pagos registrados' })).toHaveTextContent('+ S/ 2.00')
  })
})
