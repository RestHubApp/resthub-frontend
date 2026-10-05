import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Customer, CustomerExport, CustomerPage, CustomerRequest } from './types'

// La libreta de clientes del local.

export const customersQueryKey = ['customers'] as const

export function customerSearchQuery(text: string) {
  return queryOptions({
    queryKey: [...customersQueryKey, 'search', text],
    queryFn: async () => {
      const { data } = await api.get<CustomerPage>('/customers', { params: { q: text, limit: 50 } })
      return data
    },
  })
}

export function customerQuery(customerId: number) {
  return queryOptions({
    queryKey: [...customersQueryKey, 'detail', customerId],
    queryFn: async () => {
      const { data } = await api.get<Customer>(`/customers/${String(customerId)}`)
      return data
    },
  })
}

/** `timeout` acorta el plazo cuando quien llama puede seguir sin la respuesta. */
export async function saveCustomer(
  payload: CustomerRequest,
  customerId?: number,
  options: { readonly timeout?: number } = {},
): Promise<Customer> {
  const { data } =
    customerId === undefined
      ? await api.post<Customer>('/customers', payload, options)
      : await api.put<Customer>(`/customers/${String(customerId)}`, payload, options)
  return data
}

/** Derecho de acceso (Ley N.º 29733): lo que el local guarda de un cliente, completo. */
export async function exportCustomer(customerId: number): Promise<CustomerExport> {
  const { data } = await api.get<CustomerExport>(`/customers/${String(customerId)}/export`)
  return data
}

/** Derecho de cancelación: borra sus datos de la ficha, sus pedidos y sus reservas. No se deshace. */
export async function anonymizeCustomer(customerId: number): Promise<void> {
  await api.post(`/customers/${String(customerId)}/anonymize`)
}
