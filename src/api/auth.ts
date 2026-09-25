import { api } from '../services/api'
import type {
  AccessTokenResponse,
  ChangeOwnPasswordRequest,
  CurrentUserResponse,
  LoginRequest,
} from './types'

export const currentUserQueryKey = ['auth', 'me'] as const

export async function login(payload: LoginRequest): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>('/auth/login', payload)
  return data
}

/**
 * La cuenta, su restaurante y sus permisos.
 *
 * Recibe el token de forma explicita porque justo despues de entrar todavia no
 * es el de la sesion: la sesion se abre recien cuando esta respuesta llega.
 */
export async function fetchCurrentUser(token?: string): Promise<CurrentUserResponse> {
  const headers = token === undefined ? undefined : { Authorization: `Bearer ${token}` }
  const { data } = await api.get<CurrentUserResponse>('/auth/me', { headers })
  return data
}

export async function changeOwnPassword(payload: ChangeOwnPasswordRequest): Promise<void> {
  await api.post('/auth/me/password', payload)
}
