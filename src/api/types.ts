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
