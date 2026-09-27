import { describe, expect, it } from '@jest/globals'

import { errorMessage, errorStatus } from '../../services/api'
import { fetchCurrentCash } from '../cash'
import { addPayment } from '../orders'
import type { PaymentRequest } from '../types'
import { orderShape, PAYMENT_METHODS, paymentShape } from './orderShapes'
import {
  API_PREFIX,
  bearer,
  connectTo,
  eachLike,
  errorBody,
  fromProviderState,
  integer,
  isoDatetime,
  JSON_HEADERS,
  like,
  money,
  newPact,
  oneOf,
  rejectionOf,
  STATE,
  statePath,
  string,
} from './pactHarness'

const pact = newPact()
const EXAMPLE_ORDER = 21
const EXAMPLE_BALANCE = '30.00'
const PAYMENTS_PATH = statePath('/orders/${orderId}/payments', `/orders/${String(EXAMPLE_ORDER)}/payments`)

// El pago como lo arma el formulario de cobro: el medio, sin vuelto (no es
// efectivo), sin propina y con el saldo que ve quien cobra.
const payment: PaymentRequest = {
  payment_method: 'yape',
  amount_received: null,
  tip: '0',
  expected_balance: EXAMPLE_BALANCE,
}

function paymentBody() {
  return { ...payment, expected_balance: fromProviderState('${balance}', EXAMPLE_BALANCE) }
}

describe('Contrato: cobro', () => {
  it('cobra el saldo que vio quien cobra y el pedido queda pagado', async () => {
    await pact
      .addInteraction()
      .given(STATE.servedOrder)
      .uponReceiving('un pago con el saldo esperado vigente')
      .withRequest('POST', PAYMENTS_PATH, (req) => req.headers({ ...bearer(), ...JSON_HEADERS }).jsonBody(paymentBody()))
      // 201: cada pago es un recurso nuevo del pedido.
      .willRespondWith(201, (res) =>
        res.jsonBody(
          orderShape('paid', {
            id: fromProviderState('${orderId}', EXAMPLE_ORDER),
            balance: money('0.00'),
            paid_amount: money(EXAMPLE_BALANCE),
            payments: eachLike(paymentShape()),
            payment_method: oneOf(PAYMENT_METHODS, 'yape'),
            paid_at: isoDatetime(),
          }),
        ),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const order = await addPayment(EXAMPLE_ORDER, payment)
        expect(order.status).toBe('paid')
        expect(order.balance).toBe('0.00')
      })
  })

  it('si otro pago cambió el saldo, responde 409 y no cobra dos veces', async () => {
    await pact
      .addInteraction()
      .given(STATE.balanceChanged)
      .uponReceiving('un pago con un saldo esperado que ya cambió')
      .withRequest('POST', PAYMENTS_PATH, (req) => req.headers({ ...bearer(), ...JSON_HEADERS }).jsonBody(paymentBody()))
      .willRespondWith(409, (res) =>
        res.jsonBody(errorBody('La cuenta cambió mientras se cobraba: ahora faltan S/ 15.00. Revísala.')),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const error = await rejectionOf(addPayment(EXAMPLE_ORDER, payment))
        expect(errorStatus(error)).toBe(409)
        expect(errorMessage(error, '')).toContain('cambió')
      })
  })

  it('lee la sesión de caja abierta con su arqueo en curso', async () => {
    await pact
      .addInteraction()
      .given(STATE.cashOpen)
      .uponReceiving('la lectura de la caja abierta')
      .withRequest('GET', `${API_PREFIX}/cash/current`, (req) => req.headers(bearer()))
      .willRespondWith(200, (res) =>
        res.jsonBody({
          is_open: true,
          session: like({
            id: integer(1),
            is_open: true,
            opened_by: integer(1),
            opened_by_name: string('Encargado Demo'),
            opened_at: isoDatetime(),
            opening_amount: money('100.00'),
            closed_at: null,
            summary: like({
              opening_amount: money('100.00'),
              sales: money('56.00'),
              tips: money('0.00'),
              expected_cash: money('100.00'),
              paid_orders: integer(1),
            }),
            open_orders: integer(0),
          }),
        }),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const cash = await fetchCurrentCash()
        expect(cash.is_open).toBe(true)
        expect(cash.session?.summary?.expected_cash).toMatch(/^\d+\.\d{2}$/u)
      })
  })
})

