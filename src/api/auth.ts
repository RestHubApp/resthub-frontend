import { api } from '../services/api'
import type {
  AccessTokenResponse,
  ChangeOwnPasswordRequest,
  CurrentUserResponse,
  LoginRequest,
} from './types'

export const currentUserQueryKey = ['auth', 'me'] as const

/** El token y, en la misma respuesta, la cuenta, su restaurante y sus permisos. */
export async function login(payload: LoginRequest): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>('/auth/login', payload)
  return data
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await api.get<CurrentUserResponse>('/auth/me')
  return data
}

export async function changeOwnPassword(payload: ChangeOwnPasswordRequest): Promise<void> {
  await api.post('/auth/me/password', payload)
}
