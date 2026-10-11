import { describe, expect, it, jest } from '@jest/globals'
import { screen, within } from '@testing-library/react'

import { paid, payment, handleOrder } from '#jest/fixtures/charge'
import { signInAs, handleMount, ErrorResponse, server, type Request } from '#jest/harness'
import type { OrderResponse } from '@/api/types'
import { ChargeDialog } from './ChargeDialog'

const PAYMENTS = '/orders/12/payments'
const CONFIRM = { name: 'Confirmar pago' }
const RECEIVED = 'Monto recibido'
const REGISTERED = { name: 'Cobro registrado' }
const CHARGING = { name: 'Cobrar pedido #34' }

// Un servidor que recuerda el pedido: cada pago lo cambia y la consulta lo relee.
type OnPay = (request: Request, actual: OrderResponse) => OrderResponse | ErrorResponse

function charge(initial: OrderResponse = handleOrder(), respond?: OnPay) {
  let actual = initial
  const api = server()
    .on('get', '/cash/current', { is_open: true, session: null })
    .on('get', '/orders/12', () => actual)
  api.on('post', PAYMENTS, (request: Request) => {
    const response = respond ? respond(request, actual) : paid(actual, payment({ method: 'cash', method_label: 'Efectivo' }))
    if (!(response instanceof ErrorResponse)) {
      actual = response
    }
    return response
  })
  signInAs()
  const onClose = jest.fn()
  const mount = handleMount(<ChargeDialog order={initial} onClose={onClose} />)
  return { api, onClose, ...mount }
}

function paymentBody(api: ReturnType<typeof server>) {
  return api.calls('post', PAYMENTS)[0]?.body
}

describe('ChargeDialog: todo junto', () => {
  it('en efectivo calcula el vuelto en vivo y envía el saldo esperado', async () => {
    const { api, user } = charge(handleOrder(), (_p, actual) =>
      paid(actual, payment({ method: 'cash', method_label: 'Efectivo', amount: '50.00', amount_received: '100.00', change: '50.00' })),
    )

    expect(await screen.findByRole('dialog', CHARGING)).toBeInTheDocument()
    expect(screen.getByText('Total a cobrar')).toBeInTheDocument()
    await user.type(screen.getByLabelText(RECEIVED), '100')
    expect(screen.getByText('Vuelto').nextSibling).toHaveTextContent('S/ 50.00')
    await user.click(screen.getByRole('button', CONFIRM))

    expect(await screen.findByRole('dialog', REGISTERED)).toBeInTheDocument()
    expect(screen.getByText('Pedido #34 pagado · Efectivo')).toBeInTheDocument()
    expect(paymentBody(api)).toEqual({
      payment_method: 'cash',
      amount_received: '100',
      tip: '0',
      expected_balance: '50.00',
    })
    expect(await screen.findByText('Pedido #34 pagado.')).toBeInTheDocument()
  })

  it('no deja cobrar en efectivo si lo recibido no cubre la cuenta', async () => {
    const { api, user } = charge()

    await user.type(await screen.findByLabelText(RECEIVED), '40')
    expect(screen.getByText('Vuelto').nextSibling).toHaveTextContent('—')
    await user.click(screen.getByRole('button', CONFIRM))

    expect(await screen.findByText('El monto no cubre lo que se cobra')).toBeInTheDocument()
    expect(api.calls('post', PAYMENTS)).toHaveLength(0)
  })

  it('la propina rápida se suma a lo que se cobra y viaja aparte', async () => {
    const { api, user } = charge()

    const quick = within(await screen.findByRole('group', { name: 'Propinas rápidas' }))
    await user.click(quick.getByRole('button', { name: /^S\/\s5\.00$/u }))
    await user.click(within(screen.getByRole('group', { name: 'Montos rápidos' })).getByRole('button', { name: 'Monto exacto' }))
    expect(screen.getByLabelText(RECEIVED)).toHaveValue('55.00')
    await user.click(screen.getByRole('button', CONFIRM))

    await screen.findByRole('dialog', REGISTERED)
    expect(paymentBody(api)).toMatchObject({ tip: '5', amount_received: '55.00' })
  })

  it('con Yape no pide el monto recibido y lo envía vacío', async () => {
    const { api, user } = charge()

    await user.click(await screen.findByRole('radio', { name: 'Yape' }))
    expect(screen.queryByLabelText(RECEIVED)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', CONFIRM))

    await screen.findByRole('dialog', REGISTERED)
    expect(paymentBody(api)).toMatchObject({ payment_method: 'yape', amount_received: null })
  })

  it('una propina mal escrita se marca en el campo', async () => {
    const { api, user } = charge()

    await user.type(await screen.findByLabelText('Propina (opcional)'), 'dos')
    await user.click(screen.getByRole('button', CONFIRM))

    expect(await screen.findByText('Escribe un monto como 100 o 100.50')).toBeInTheDocument()
    expect(api.calls('post', PAYMENTS)).toHaveLength(0)
  })
})

describe('ChargeDialog: sin caja o con error', () => {
  it('con la caja cerrada lo avisa y no deja confirmar', async () => {
    server().on('get', '/cash/current', { is_open: false, session: null })
    signInAs()
    handleMount(<ChargeDialog order={handleOrder()} onClose={jest.fn()} />)

    expect(await screen.findByText('La caja está cerrada.')).toBeInTheDocument()
    expect(screen.getByRole('button', CONFIRM)).toBeDisabled()
  })

  it('si el servidor rechaza el pago muestra su motivo y la ventana sigue abierta', async () => {
    const { api, user } = charge(handleOrder(), () => new ErrorResponse(409, 'El saldo cambió: vuelve a revisar la cuenta.'))

    await user.click(await screen.findByRole('button', CONFIRM))

    expect(await screen.findByText('El saldo cambió: vuelve a revisar la cuenta.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', CHARGING)).toBeInTheDocument()
    expect(api.calls('post', PAYMENTS)).toHaveLength(1)
  })

  it('«Volver» cierra la ventana sin cobrar', async () => {
    const { api, onClose, user } = charge()

    await user.click(await screen.findByRole('button', { name: 'Volver' }))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(api.calls('post', PAYMENTS)).toHaveLength(0)
  })

  it('Escape cierra la ventana como «Volver»', async () => {
    const { onClose, user } = charge()

    await screen.findByRole('dialog', CHARGING)
    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('sin pedido no muestra nada', () => {
    server()
    signInAs()
    handleMount(<ChargeDialog order={null} onClose={jest.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
