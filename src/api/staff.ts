import { api } from '../services/api'
import type {
  CreateStaffRequest,
  ResetStaffPasswordRequest,
  StaffListResponse,
  StaffResponse,
  UpdateStaffRequest,
} from './types'

// Gestion del personal del restaurante (solo el encargado).
//
// Las rutas se fijaron antes de que existiera el backend: si al generar el
// contrato alguna cambia, se corrige en este archivo y en ninguna pantalla.

export const staffQueryKey = ['staff'] as const

function staffPath(userId: number, action = ''): string {
  return `/staff/${String(userId)}${action}`
}

export async function fetchStaff(): Promise<StaffListResponse> {
  const { data } = await api.get<StaffListResponse>('/staff')
  return data
}

export async function createStaff(payload: CreateStaffRequest): Promise<StaffResponse> {
  const { data } = await api.post<StaffResponse>('/staff', payload)
  return data
}

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
  const { data } = await api.post<StaffResponse>(staffPath(userId, '/status'), {
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
