import { describe, expect, it } from '@jest/globals'

import { errorStatus } from '../../services/api'
import { fetchSalesSummary } from '../insights'
import {
  API_PREFIX,
  bearer,
  connectTo,
  errorBody,
  integer,
  isoDate,
  like,
  money,
  newPact,
  nullValue,
  rejectionOf,
  STATE,
  string,
} from './pactHarness'

const pact = newPact()
const SUMMARY_PATH = `${API_PREFIX}/insights/summary`
const RANGE = { date_from: '2026-09-01', date_to: '2026-09-26' }

describe('Contrato: indicadores', () => {
  it('el encargado lee el resumen de ventas del período', async () => {
    await pact
      .addInteraction()
      .given(STATE.ownerSession)
      .uponReceiving('la lectura del resumen de ventas de un rango')
      .withRequest('GET', SUMMARY_PATH, (req) => req.headers(bearer()).query(RANGE))
      .willRespondWith(200, (res) =>
        res.jsonBody({
          sales: money('1250.00'),
          paid_orders: integer(42),
          average_ticket: money('29.76'),
          cancelled_orders: integer(1),
          cancelled_amount: money('18.00'),
          period: like({
            date_from: isoDate(RANGE.date_from),
            date_to: isoDate(RANGE.date_to),
            days: integer(26),
            timezone: string('America/Lima'),
          }),
          previous: like({
            sales: money('0.00'),
            paid_orders: integer(0),
            average_ticket: money('0.00'),
            date_from: isoDate('2026-08-06'),
            date_to: isoDate('2026-08-31'),
          }),
          // Sin ventas en el período anterior no hay contra qué comparar: `null`.
          sales_change_percent: nullValue(),
        }),
      )
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const summary = await fetchSalesSummary(RANGE)
        expect(summary.period.timezone).toBe('America/Lima')
        expect(summary.sales_change_percent).toBeNull()
      })
  })

  it('el mesero, sin el permiso de indicadores, recibe 403', async () => {
    await pact
      .addInteraction()
      .given(STATE.waiterSession)
      .uponReceiving('la lectura de indicadores sin el permiso insights.read')
      .withRequest('GET', SUMMARY_PATH, (req) => req.headers(bearer()).query(RANGE))
      .willRespondWith(403, (res) => res.jsonBody(errorBody('No tienes permiso para esta acción.')))
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const error = await rejectionOf(fetchSalesSummary(RANGE))
        expect(errorStatus(error)).toBe(403)
      })
  })
})
