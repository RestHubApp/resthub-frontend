import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import { inventoryQueryKey } from './inventory'
import type {
  CreatePurchaseOrderRequest,
  PurchaseOrder,
  PurchaseOrderPage,
  PurchaseSuggestion,
  ReceivePurchaseOrderRequest,
  Supplier,
  SupplierRequest,
} from './types'

// Compras del inventario: proveedores, órdenes de compra y sugerencias.
// Cuelgan de la raíz del inventario: recibir una orden cambia el stock.

const suppliersQueryKey = [...inventoryQueryKey, 'suppliers'] as const
const purchaseOrdersQueryKey = [...inventoryQueryKey, 'purchase-orders'] as const
const purchaseSuggestionsQueryKey = [...inventoryQueryKey, 'purchase-suggestions'] as const

async function fetchSuppliers(): Promise<Supplier[]> {
  return send((client) => client.GET('/api/v1/inventory/suppliers'))
}

export const suppliersQuery = queryOptions({ queryKey: suppliersQueryKey, queryFn: fetchSuppliers })

export async function saveSupplier(payload: SupplierRequest, supplierId?: number): Promise<Supplier> {
  if (supplierId === undefined) {
    return send((client) => client.POST('/api/v1/inventory/suppliers', { body: payload }))
  }
  return send((client) =>
    client.PUT('/api/v1/inventory/suppliers/{supplier_id}', {
      params: { path: { supplier_id: supplierId } },
      body: payload,
    }),
  )
}

async function fetchPurchaseOrders(): Promise<PurchaseOrderPage> {
  return send((client) => client.GET('/api/v1/inventory/purchase-orders', { params: { query: { limit: 100 } } }))
}

export const purchaseOrdersQuery = queryOptions({
  queryKey: purchaseOrdersQueryKey,
  queryFn: fetchPurchaseOrders,
})

async function fetchPurchaseSuggestions(): Promise<PurchaseSuggestion[]> {
  return send((client) => client.GET('/api/v1/inventory/purchase-suggestions'))
}

export const purchaseSuggestionsQuery = queryOptions({
  queryKey: purchaseSuggestionsQueryKey,
  queryFn: fetchPurchaseSuggestions,
})

export async function createPurchaseOrder(payload: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
  return send((client) => client.POST('/api/v1/inventory/purchase-orders', { body: payload }))
}

/** Enviar al proveedor o cancelar. */
export async function changePurchaseOrder(
  orderId: number,
  action: 'send' | 'cancel',
): Promise<PurchaseOrder> {
  const params = { path: { order_id: orderId } }
  if (action === 'send') {
    return send((client) => client.POST('/api/v1/inventory/purchase-orders/{order_id}/send', { params }))
  }
  return send((client) => client.POST('/api/v1/inventory/purchase-orders/{order_id}/cancel', { params }))
}

export async function receivePurchaseOrder(
  orderId: number,
  payload: ReceivePurchaseOrderRequest,
): Promise<PurchaseOrder> {
  return send((client) =>
    client.POST('/api/v1/inventory/purchase-orders/{order_id}/receive', {
      params: { path: { order_id: orderId } },
      body: payload,
    }),
  )
}
