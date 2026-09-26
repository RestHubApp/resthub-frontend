import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
import type { Customer, CustomerPage, CustomerRequest } from './types'

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

export async function saveCustomer(payload: CustomerRequest, customerId?: number): Promise<Customer> {
  const { data } =
    customerId === undefined
      ? await api.post<Customer>('/customers', payload)
      : await api.put<Customer>(`/customers/${String(customerId)}`, payload)
  return data
}
