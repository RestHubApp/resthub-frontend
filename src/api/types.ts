// Alias sobre el contrato generado desde OpenAPI. Nadie escribe estas formas a
// mano: si el backend cambia un campo, `pnpm generate:api` lo propaga y el
// build del frontend falla en compilacion en vez de fallar en ejecucion.
import type { components } from './schema'

export type HealthResponse = components['schemas']['HealthResponse']

export type AccessTokenResponse = components['schemas']['AccessTokenResponse']
export type LoginRequest = components['schemas']['LoginRequest']
export type ChangeOwnPasswordRequest = components['schemas']['ChangeOwnPasswordRequest']
export type CurrentUserResponse = components['schemas']['CurrentUserResponse']
export type UserResponse = components['schemas']['UserResponse']
export type RestaurantResponse = components['schemas']['RestaurantResponse']
export type UserRole = components['schemas']['Role']
export type PermissionCode = components['schemas']['Permission']

export type StaffResponse = components['schemas']['StaffResponse']
export type StaffListResponse = components['schemas']['StaffListResponse']
export type CreateStaffRequest = components['schemas']['CreateStaffRequest']
export type UpdateStaffRequest = components['schemas']['UpdateStaffRequest']
export type ResetStaffPasswordRequest = components['schemas']['ResetStaffPasswordRequest']
