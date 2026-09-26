import { queryOptions } from '@tanstack/react-query'

import { api, errorStatus } from '../services/api'
import type {
  BillingSettings,
  BillingSettingsRequest,
  Invoice,
  InvoicePage,
  IssueInvoiceRequest,
} from './types'

// Comprobantes electrónicos (SUNAT): boletas, facturas y los datos fiscales.

export const billingQueryKey = ['billing'] as const
export const billingSettingsQueryKey = [...billingQueryKey, 'settings'] as const
export const invoicesQueryKey = [...billingQueryKey, 'invoices'] as const

export function orderInvoiceQueryKey(orderId: number) {
  return [...billingQueryKey, 'order', orderId] as const
}

export function invoiceQueryKey(invoiceId: number) {
  return [...billingQueryKey, 'invoice', invoiceId] as const
}

export async function fetchBillingSettings(): Promise<BillingSettings> {
  const { data } = await api.get<BillingSettings>('/billing/settings')
  return data
}

export const billingSettingsQuery = queryOptions({
  queryKey: billingSettingsQueryKey,
  queryFn: fetchBillingSettings,
})

export async function updateBillingSettings(payload: BillingSettingsRequest): Promise<BillingSettings> {
  const { data } = await api.put<BillingSettings>('/billing/settings', payload)
  return data
}

export async function fetchInvoices(offset = 0): Promise<InvoicePage> {
  const { data } = await api.get<InvoicePage>('/billing/invoices', { params: { limit: 25, offset } })
  return data
}

export function invoicesQuery(offset: number) {
  return queryOptions({ queryKey: [...invoicesQueryKey, offset], queryFn: () => fetchInvoices(offset) })
}

export async function fetchInvoice(invoiceId: number): Promise<Invoice> {
  const { data } = await api.get<Invoice>(`/billing/invoices/${String(invoiceId)}`)
  return data
}

/** El comprobante de un pedido, o `null` si todavía no se emitió. */
export async function fetchOrderInvoice(orderId: number): Promise<Invoice | null> {
  try {
    const { data } = await api.get<Invoice>(`/billing/orders/${String(orderId)}/invoice`)
    return data
  } catch (error: unknown) {
    if (errorStatus(error) === 404) {
      return null
    }
    throw error
  }
}

export async function issueInvoice(payload: IssueInvoiceRequest): Promise<Invoice> {
  const { data } = await api.post<Invoice>('/billing/invoices', payload)
  return data
}

export async function resendInvoice(invoiceId: number): Promise<Invoice> {
  const { data } = await api.post<Invoice>(`/billing/invoices/${String(invoiceId)}/resend`)
  return data
}
