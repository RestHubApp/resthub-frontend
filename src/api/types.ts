// Alias sobre el contrato generado desde OpenAPI. Nadie escribe estas formas a
// mano: si el backend cambia un campo, `pnpm generate:api` lo propaga y el
// build del frontend falla en compilacion en vez de fallar en ejecucion.
import type { components, operations } from './schema'

export type HealthResponse = components['schemas']['HealthResponse']

export type AccessTokenResponse = components['schemas']['AccessTokenResponse']
export type LoginRequest = components['schemas']['LoginRequest']
export type ChangeOwnPasswordRequest = components['schemas']['ChangeOwnPasswordRequest']
export type CurrentUserResponse = components['schemas']['SessionResponse']
export type UserResponse = components['schemas']['SessionUserResponse']
export type RestaurantResponse = components['schemas']['SessionRestaurantResponse']
export type UserRole = components['schemas']['Role']
export type PermissionCode = components['schemas']['Permission']

export type StaffResponse = components['schemas']['StaffMemberResponse']
export type StaffListResponse = components['schemas']['StaffPageResponse']
export type StaffListParams = NonNullable<
  operations['list_staff_api_v1_staff_get']['parameters']['query']
>
export type CreateStaffRequest = components['schemas']['RegisterStaffRequest']
export type UpdateStaffRequest = components['schemas']['UpdateStaffRequest']
export type ResetStaffPasswordRequest = components['schemas']['ResetStaffPasswordRequest']

// Pedidos, mesas y la carta que usa la toma de pedidos. Los nombres de la
// carta llevan el prefijo `Order` para no chocar con los de la pantalla Menú.
export type OrderMenu = components['schemas']['MenuResponse']
export type OrderMenuSection = components['schemas']['MenuSectionResponse']
export type OrderMenuItem = components['schemas']['MenuItemResponse']

export type TableState = components['schemas']['TableStateResponse']
export type TableResponse = components['schemas']['TableResponse']
export type ActiveOrderSummary = components['schemas']['ActiveOrderSummary']
export type CreateTableRequest = components['schemas']['CreateTableRequest']
export type UpdateTableRequest = components['schemas']['UpdateTableRequest']

export type OrderResponse = components['schemas']['OrderResponse']
export type OrderItemResponse = components['schemas']['OrderItemResponse']
export type OrderPageResponse = components['schemas']['OrderPageResponse']
export type OrderStatus = components['schemas']['OrderStatus']
export type OrderType = components['schemas']['OrderType']
export type PaymentMethod = components['schemas']['PaymentMethod']
export type OpenOrderRequest = components['schemas']['OpenOrderRequest']
export type NewItemRequest = components['schemas']['NewItemRequest']
export type ChangeItemRequest = components['schemas']['ChangeItemRequest']
export type UpdateOrderRequest = components['schemas']['UpdateOrderRequest']
export type ChargeOrderRequest = components['schemas']['ChargeOrderRequest']
export type OrderListParams = NonNullable<
  operations['list_orders_api_v1_orders_get']['parameters']['query']
>
