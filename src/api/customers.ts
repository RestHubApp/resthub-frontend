import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type { Customer, CustomerContact, CustomerExport, CustomerRequest } from './types'

// La libreta de clientes del local.

export const customersQueryKey = ['customers'] as const

export function customerSearchQuery(text: string) {
  return queryOptions({
    queryKey: [...customersQueryKey, 'search', text],
    queryFn: () => send((client) => client.GET('/api/v1/customers', { params: { query: { q: text, limit: 50 } } })),
  })
}

export function customerQuery(customerId: number) {
  return queryOptions({
    queryKey: [...customersQueryKey, 'detail', customerId],
    queryFn: () =>
      send((client) => client.GET('/api/v1/customers/{customer_id}', { params: { path: { customer_id: customerId } } })),
  })
}

/** `timeout` acorta el plazo cuando quien llama puede seguir sin la respuesta. */
export async function saveCustomer(
  payload: CustomerRequest,
  customerId?: number,
  options: { readonly timeout?: number } = {},
): Promise<Customer> {
  if (customerId === undefined) {
    return send((client) => client.POST('/api/v1/customers', { body: payload }), options)
  }
  return send(
    (client) =>
      client.PUT('/api/v1/customers/{customer_id}', { params: { path: { customer_id: customerId } }, body: payload }),
    options,
  )
}

/** Derecho de acceso (Ley N.º 29733): lo que el local guarda de un cliente, completo. */
export async function exportCustomer(customerId: number): Promise<CustomerExport> {
  return send((client) =>
    client.GET('/api/v1/customers/{customer_id}/export', { params: { path: { customer_id: customerId } } }),
  )
}

/** Derecho de cancelación: borra sus datos de la ficha, sus pedidos y sus reservas. No se deshace. */
export async function anonymizeCustomer(customerId: number): Promise<void> {
  await send((client) =>
    client.POST('/api/v1/customers/{customer_id}/anonymize', { params: { path: { customer_id: customerId } } }),
  )
}

/**
 * «Ver completo»: el teléfono y el correo sin enmascarar. Queda en la bitácora
 * quién los vio. Es una mutación y no una consulta: así el dato no se guarda en el caché.
 */
export async function revealCustomer(customerId: number): Promise<CustomerContact> {
  return send((client) =>
    client.POST('/api/v1/customers/{customer_id}/reveal', { params: { path: { customer_id: customerId } } }),
  )
}
