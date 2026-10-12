import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type {
  CreateStaffRequest,
  ResetStaffPasswordRequest,
  StaffListParams,
  StaffListResponse,
  StaffResponse,
  UpdateStaffRequest,
} from './types'

// Gestion del personal del restaurante (solo el encargado).

export const staffQueryKey = ['staff'] as const

/** El tope de pagina que acepta el servidor. */
export const MAX_STAFF_PAGE = 100

function staffListQueryKey(params: StaffListParams) {
  return [...staffQueryKey, params] as const
}

async function fetchStaff(params: StaffListParams = {}): Promise<StaffListResponse> {
  // El filtro por rol es una lista: FastAPI la espera como `role_id=1&role_id=2`
  // (la forma por defecto del cliente) y no con corchetes.
  return send((client) => client.GET('/api/v1/staff', { params: { query: params } }))
}

export function staffQuery(params: StaffListParams) {
  return queryOptions({ queryKey: staffListQueryKey(params), queryFn: () => fetchStaff(params) })
}

export async function createStaff(payload: CreateStaffRequest): Promise<StaffResponse> {
  return send((client) => client.POST('/api/v1/staff', { body: payload }))
}

/** Nombre y rol. El correo no se edita: es con lo que la persona entra. */
export async function updateStaff(
  userId: number,
  payload: UpdateStaffRequest,
): Promise<StaffResponse> {
  return send((client) =>
    client.PATCH('/api/v1/staff/{user_id}', { params: { path: { user_id: userId } }, body: payload }),
  )
}

export async function changeStaffStatus(
  userId: number,
  isActive: boolean,
): Promise<StaffResponse> {
  return send((client) =>
    client.PATCH('/api/v1/staff/{user_id}/status', {
      params: { path: { user_id: userId } },
      body: { is_active: isActive },
    }),
  )
}

export async function resetStaffPassword(
  userId: number,
  payload: ResetStaffPasswordRequest,
): Promise<void> {
  await send((client) =>
    client.POST('/api/v1/staff/{user_id}/password', { params: { path: { user_id: userId } }, body: payload }),
  )
}
