import { describe, expect, it } from '@jest/globals'

import { fetchOrderInvoice, issueInvoice } from '../billing'
import type { IssueInvoiceRequest } from '../types'
import {
  API_PREFIX,
  bearer,
  connectTo,
  eachLike,
  fromProviderState,
  integer,
  isoDatetime,
  JSON_HEADERS,
  like,
  money,
  newPact,
  oneOf,
  regex,
  STATE,
  statePath,
  string,
} from './pactHarness'

const pact = newPact()
const EXAMPLE_ORDER = 31
// Lo que manda el diálogo de emisión para una boleta a «clientes varios».
const BOLETA: IssueInvoiceRequest = {
  order_id: EXAMPLE_ORDER,
  kind: 'boleta',
  customer_document_type: 'none',
  customer_document_number: '',
  customer_name: '',
  customer_address: '',
}
const INVOICE_STATUSES = ['accepted', 'pending', 'rejected', 'simulated'] as const

function invoiceShape() {
  return like({
    id: integer(1),
    order_id: fromProviderState('${orderId}', EXAMPLE_ORDER),
    kind: oneOf(['boleta', 'factura'], 'boleta'),
    kind_label: string('Boleta de venta'),
    code: regex(/^[BF][A-Z0-9]{3}-\d+$/u, 'B001-1'),
    series: regex(/^[BF][A-Z0-9]{3}$/u, 'B001'),
    number: integer(1),
    customer_document_type: oneOf(['none', 'dni', 'ce', 'ruc'], 'none'),
    customer_document_number: string(''),
    customer_name: string('Clientes varios'),
    lines: eachLike({
      description: string('Lomo saltado'),
      quantity: integer(2),
      unit_price: money('15.00'),
      total: money('30.00'),
    }),
    discount: money('0.00'),
    taxable: money('25.42'),
    igv: money('4.58'),
    igv_rate: money('18.00'),
    total: money('30.00'),
    status: oneOf(INVOICE_STATUSES, 'simulated'),
    status_label: string('Sin enviar (sin proveedor)'),
    provider_message: string(''),
    pdf_url: string(''),
    issued_at: isoDatetime(),
  })
}

describe('Contrato: comprobantes', () => {
  it('emite la boleta de un pedido pagado', async () => {
    await pact
      .addInteraction()
      .given(STATE.paidOrder)
      .uponReceiving('la emisión de la boleta de un pedido pagado')
      .withRequest('POST', `${API_PREFIX}/billing/invoices`, (req) =>
        req
          .headers({ ...bearer(), ...JSON_HEADERS })
          .jsonBody({ ...BOLETA, order_id: fromProviderState('${orderId}', EXAMPLE_ORDER) }),
      )
      .willRespondWith(201, (res) => res.jsonBody(invoiceShape()))
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const invoice = await issueInvoice(BOLETA)
        expect(invoice.order_id).toBe(EXAMPLE_ORDER)
        expect(invoice.code).toMatch(/^B/u)
      })
  })

  it('lee el comprobante ya emitido de un pedido', async () => {
    await pact
      .addInteraction()
      .given(STATE.invoicedOrder)
      .uponReceiving('la lectura del comprobante de un pedido')
      .withRequest('GET', statePath('/billing/orders/${orderId}/invoice', `/billing/orders/${String(EXAMPLE_ORDER)}/invoice`), (req) =>
        req.headers(bearer()),
      )
      .willRespondWith(200, (res) => res.jsonBody(invoiceShape()))
      .executeTest(async (mockServer) => {
        connectTo(mockServer)
        const invoice = await fetchOrderInvoice(EXAMPLE_ORDER)
        expect(invoice?.total).toMatch(/^\d+\.\d{2}$/u)
      })
  })
})
