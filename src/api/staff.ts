import { api } from '../services/api'
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

function staffPath(userId: number, action = ''): string {
  return `/staff/${String(userId)}${action}`
}

export function staffListQueryKey(params: StaffListParams) {
  return [...staffQueryKey, params] as const
}

export async function fetchStaff(params: StaffListParams = {}): Promise<StaffListResponse> {
  // El filtro por rol es una lista: FastAPI la espera como `role=a&role=b` y
  // no con los corchetes que Axios agrega por defecto.
  const { data } = await api.get<StaffListResponse>('/staff', {
    params,
    paramsSerializer: { indexes: null },
  })
  return data
}

export async function createStaff(payload: CreateStaffRequest): Promise<StaffResponse> {
  const { data } = await api.post<StaffResponse>('/staff', payload)
  return data
}

/** Nombre y tipo de cuenta. El correo no se edita: es con lo que la persona entra. */
export async function updateStaff(
  userId: number,
  payload: UpdateStaffRequest,
): Promise<StaffResponse> {
  const { data } = await api.patch<StaffResponse>(staffPath(userId), payload)
  return data
}

export async function changeStaffStatus(
  userId: number,
  isActive: boolean,
): Promise<StaffResponse> {
  const { data } = await api.patch<StaffResponse>(staffPath(userId, '/status'), {
    is_active: isActive,
  })
  return data
}

export async function resetStaffPassword(
  userId: number,
  payload: ResetStaffPasswordRequest,
): Promise<void> {
  await api.post(staffPath(userId, '/password'), payload)
}
