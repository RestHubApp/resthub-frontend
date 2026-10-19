import { queryOptions } from '@tanstack/react-query'

import { SLOW_TIMEOUT_MS } from '@/services/api'
import { hasCode } from '@/services/apiError'
import { send } from './client'
import type {
  BillingCapabilities,
  BillingSettings,
  BillingSettingsRequest,
  CertificateUploadRequest,
  Invoice,
  InvoiceDocumentFormat,
  InvoicePage,
  IssueInvoiceRequest,
  SendInvoiceEmailRequest,
  SendInvoiceEmailResponse,
} from './types'

// Comprobantes electrónicos (SUNAT): boletas, facturas y los datos fiscales.

export const billingQueryKey = ['billing'] as const
export const billingSettingsQueryKey = [...billingQueryKey, 'settings'] as const
const invoicesQueryKey = [...billingQueryKey, 'invoices'] as const

export function orderInvoiceQueryKey(orderId: number) {
  return [...billingQueryKey, 'order', orderId] as const
}

function invoiceQueryKey(invoiceId: number) {
  return [...billingQueryKey, 'invoice', invoiceId] as const
}

async function fetchBillingSettings(): Promise<BillingSettings> {
  return send((client) => client.GET('/api/v1/billing/settings'))
}

export const billingSettingsQuery = queryOptions({
  queryKey: billingSettingsQueryKey,
  queryFn: fetchBillingSettings,
})

export async function updateBillingSettings(payload: BillingSettingsRequest): Promise<BillingSettings> {
  return send((client) => client.PUT('/api/v1/billing/settings', { body: payload }))
}

/** Sube o reemplaza el certificado digital del local; devuelve los datos fiscales con su vencimiento. */
export async function uploadCertificate(payload: CertificateUploadRequest): Promise<BillingSettings> {
  return send((client) => client.PUT('/api/v1/billing/settings/certificate', { body: payload }), { timeout: SLOW_TIMEOUT_MS })
}

/** Un PDF, un XML o un ZIP: se recibe tal cual, como archivo. */
const AS_FILE = { headers: { Accept: '*/*' }, parseAs: 'blob' } as const

/**
 * Un archivo del comprobante (PDF, XML o CDR), pedido con la sesión: ya no hay
 * enlaces públicos. Si todavía no existe, rechaza con `invoice_document_unavailable`.
 */
export async function downloadInvoiceDocument(invoiceId: number, format: InvoiceDocumentFormat): Promise<Blob> {
  return send(
    (client) =>
      client.GET('/api/v1/billing/invoices/{invoice_id}/{document_format}', {
        params: { path: { invoice_id: invoiceId, document_format: format } },
        ...AS_FILE,
      }),
    { timeout: SLOW_TIMEOUT_MS },
  )
}

async function fetchInvoices(offset = 0): Promise<InvoicePage> {
  return send((client) => client.GET('/api/v1/billing/invoices', { params: { query: { limit: 25, offset } } }))
}

export function invoicesQuery(offset: number) {
  return queryOptions({ queryKey: [...invoicesQueryKey, offset], queryFn: () => fetchInvoices(offset) })
}

async function fetchInvoice(invoiceId: number): Promise<Invoice> {
  return send((client) =>
    client.GET('/api/v1/billing/invoices/{invoice_id}', { params: { path: { invoice_id: invoiceId } } }),
  )
}

/** El comprobante de un pedido, o `null` si todavía no se emitió. */
export async function fetchOrderInvoice(orderId: number): Promise<Invoice | null> {
  try {
    return await send((client) =>
      client.GET('/api/v1/billing/orders/{order_id}/invoice', { params: { path: { order_id: orderId } } }),
    )
  } catch (error: unknown) {
    if (hasCode(error, 'invoice_not_found')) {
      return null
    }
    throw error
  }
}

/** El servidor lo manda al proveedor antes de responder: puede tardar más que una petición común. */
export async function issueInvoice(payload: IssueInvoiceRequest): Promise<Invoice> {
  return send((client) => client.POST('/api/v1/billing/invoices', { body: payload }), { timeout: SLOW_TIMEOUT_MS })
}

export async function resendInvoice(invoiceId: number): Promise<Invoice> {
  return send(
    (client) =>
      client.POST('/api/v1/billing/invoices/{invoice_id}/resend', { params: { path: { invoice_id: invoiceId } } }),
    { timeout: SLOW_TIMEOUT_MS },
  )
}

/**
 * Anula el comprobante. Si SUNAT lo había aceptado, el servidor emite la nota
 * de crédito y responde cuando el proveedor contesta; si la nota no quedó
 * aceptada, el comprobante sigue vigente con `credit_note` en curso.
 */
export async function voidInvoice(invoiceId: number, reason: string): Promise<Invoice> {
  return send(
    (client) =>
      client.POST('/api/v1/billing/invoices/{invoice_id}/void', { params: { path: { invoice_id: invoiceId } }, body: { reason } }),
    { timeout: SLOW_TIMEOUT_MS },
  )
}

/** Reenvía la nota de crédito; responde con el comprobante que anula, ya al día. */
export async function resendCreditNote(creditNoteId: number): Promise<Invoice> {
  return send(
    (client) =>
      client.POST('/api/v1/billing/credit-notes/{credit_note_id}/resend', { params: { path: { credit_note_id: creditNoteId } } }),
    { timeout: SLOW_TIMEOUT_MS },
  )
}

/** Un archivo de la nota de crédito, con la misma regla que los del comprobante. */
export async function downloadCreditNoteDocument(creditNoteId: number, format: InvoiceDocumentFormat): Promise<Blob> {
  return send(
    (client) =>
      client.GET('/api/v1/billing/credit-notes/{credit_note_id}/{document_format}', {
        params: { path: { credit_note_id: creditNoteId, document_format: format } },
        ...AS_FILE,
      }),
    { timeout: SLOW_TIMEOUT_MS },
  )
}

export function invoiceQuery(invoiceId: number) {
  return queryOptions({ queryKey: invoiceQueryKey(invoiceId), queryFn: () => fetchInvoice(invoiceId) })
}

export function orderInvoiceQuery(orderId: number) {
  return queryOptions({ queryKey: orderInvoiceQueryKey(orderId), queryFn: () => fetchOrderInvoice(orderId) })
}

/** Qué puede hacer este restaurante con un comprobante ya emitido: enviarlo por correo y respaldarlo. */
export const billingCapabilitiesQuery = queryOptions({
  queryKey: [...billingQueryKey, 'capabilities'],
  queryFn: (): Promise<BillingCapabilities> => send((client) => client.GET('/api/v1/billing/capabilities')),
  staleTime: 5 * 60_000,
})

/** Envía el comprobante por correo (Brevo). El servidor devuelve el destino ya enmascarado. */
export async function sendInvoiceEmail(invoiceId: number, body: SendInvoiceEmailRequest): Promise<SendInvoiceEmailResponse> {
  return send(
    (client) => client.POST('/api/v1/billing/invoices/{invoice_id}/email', { params: { path: { invoice_id: invoiceId } }, body }),
    { timeout: SLOW_TIMEOUT_MS },
  )
}

/** Pide o reintenta el respaldo del XML y el PDF en Google Drive; responde 202 con el comprobante. */
export async function archiveInvoice(invoiceId: number): Promise<Invoice> {
  return send((client) =>
    client.POST('/api/v1/billing/invoices/{invoice_id}/archive', { params: { path: { invoice_id: invoiceId } } }),
  )
}
