// Los códigos de error del servidor (`{ detail, code }`) de punta a punta: MSW
// responde con el contrato tipado y las funciones de `src/api` pasan por el
// cliente real. La decisión es del `code`; el `detail` solo se muestra.
import { describe, expect, it } from '@jest/globals'
import { HttpResponse, http } from 'msw'

import { apiHttp } from '#jest/apiHttp'
import { mswServer } from '#jest/mswServer'
import { ApiError, errorMessage, shouldRetry } from '@/services/apiError'
import { fetchOrderInvoice } from './billing'

const INVOICE_PATH = '/api/v1/billing/orders/{order_id}/invoice'
const NOT_FOUND = 'No existe un comprobante para ese pedido.'

function invoiceMissing(code: 'invoice_not_found' | 'order_not_found'): void {
  mswServer.use(
    apiHttp.get(INVOICE_PATH, ({ response }) =>
      response(404).json({ detail: NOT_FOUND, code }),
    ),
  )
}

describe('un pedido sin comprobante', () => {
  it('`invoice_not_found` es un «todavía no se emitió», no un fallo', async () => {
    invoiceMissing('invoice_not_found')
    await expect(fetchOrderInvoice(12)).resolves.toBeNull()
  })

  it('el mismo 404 con otro código (el pedido no existe) sí sube como error, con el texto del servidor', async () => {
    invoiceMissing('order_not_found')
    const error: unknown = await fetchOrderInvoice(12).catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'order_not_found' })
    expect(errorMessage(error, 'x')).toBe(NOT_FOUND)
  })
})

describe('qué se reintenta', () => {
  it('un servicio caído se reintenta una vez; un rechazo de negocio, nunca', async () => {
    // El 503 de la capa HTTP no está en el contrato de cada ruta: se responde sin tipar.
    mswServer.use(
      http.get('*/api/v1/billing/orders/:orderId/invoice', () =>
        HttpResponse.json({ detail: 'La base de datos no responde.', code: 'database_unavailable' }, { status: 503 }),
      ),
    )
    const down: unknown = await fetchOrderInvoice(1).catch((cause: unknown) => cause)
    expect(shouldRetry(0, down)).toBe(true)
    expect(shouldRetry(1, down)).toBe(false)

    mswServer.use(
      apiHttp.get(INVOICE_PATH, ({ response }) =>
        response(409).json({ detail: 'El pedido ya está facturado.', code: 'order_already_invoiced' }),
      ),
    )
    const rejected: unknown = await fetchOrderInvoice(1).catch((cause: unknown) => cause)
    expect(shouldRetry(0, rejected)).toBe(false)
  })
})
