import { queryOptions } from '@tanstack/react-query'

import { api } from '../services/api'
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

export const suppliersQueryKey = [...inventoryQueryKey, 'suppliers'] as const
export const purchaseOrdersQueryKey = [...inventoryQueryKey, 'purchase-orders'] as const
export const purchaseSuggestionsQueryKey = [...inventoryQueryKey, 'purchase-suggestions'] as const

export async function fetchSuppliers(): Promise<Supplier[]> {
  const { data } = await api.get<Supplier[]>('/inventory/suppliers')
  return data
}

export const suppliersQuery = queryOptions({ queryKey: suppliersQueryKey, queryFn: fetchSuppliers })

export async function saveSupplier(payload: SupplierRequest, supplierId?: number): Promise<Supplier> {
  const { data } =
    supplierId === undefined
      ? await api.post<Supplier>('/inventory/suppliers', payload)
      : await api.put<Supplier>(`/inventory/suppliers/${String(supplierId)}`, payload)
  return data
}

export async function fetchPurchaseOrders(): Promise<PurchaseOrderPage> {
  const { data } = await api.get<PurchaseOrderPage>('/inventory/purchase-orders', {
    params: { limit: 100 },
  })
  return data
}

export const purchaseOrdersQuery = queryOptions({
  queryKey: purchaseOrdersQueryKey,
  queryFn: fetchPurchaseOrders,
})

export async function fetchPurchaseSuggestions(): Promise<PurchaseSuggestion[]> {
  const { data } = await api.get<PurchaseSuggestion[]>('/inventory/purchase-suggestions')
  return data
}

export const purchaseSuggestionsQuery = queryOptions({
  queryKey: purchaseSuggestionsQueryKey,
  queryFn: fetchPurchaseSuggestions,
})

export async function createPurchaseOrder(payload: CreatePurchaseOrderRequest): Promise<PurchaseOrder> {
  const { data } = await api.post<PurchaseOrder>('/inventory/purchase-orders', payload)
  return data
}

function orderPath(orderId: number, action: string): string {
  return `/inventory/purchase-orders/${String(orderId)}/${action}`
}

/** Enviar al proveedor o cancelar. */
export async function changePurchaseOrder(
  orderId: number,
  action: 'send' | 'cancel',
): Promise<PurchaseOrder> {
  const { data } = await api.post<PurchaseOrder>(orderPath(orderId, action))
  return data
}

export async function receivePurchaseOrder(
  orderId: number,
  payload: ReceivePurchaseOrderRequest,
): Promise<PurchaseOrder> {
  const { data } = await api.post<PurchaseOrder>(orderPath(orderId, 'receive'), payload)
  return data
}
