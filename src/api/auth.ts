import { api } from '../services/api'
import type {
  AcceptTermsRequest,
  AccessTokenResponse,
  ChangeOwnPasswordRequest,
  CurrentUserResponse,
  LoginRequest,
  PreviewExchangeRequest,
} from './types'

export const currentUserQueryKey = ['auth', 'me'] as const

/**
 * La sesion que trae una respuesta con token: la cuenta, su restaurante, sus
 * permisos y si es una vista previa. Es lo mismo que devuelve `GET /auth/me`.
 */
export function sessionOf(response: AccessTokenResponse): CurrentUserResponse {
  const { user, restaurant, permissions, preview, terms_version, terms_accepted } = response
  return { user, restaurant, permissions, preview, terms_version, terms_accepted }
}

/** El token y, en la misma respuesta, la cuenta, su restaurante y sus permisos. */
export async function login(payload: LoginRequest): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>('/auth/login', payload)
  return data
}

/** Un token nuevo para la sesion actual, pedido antes de que venza el que hay. */
export async function renewSession(): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>('/auth/refresh')
  return data
}

export async function fetchCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await api.get<CurrentUserResponse>('/auth/me')
  return data
}

/** Acepta los términos y la política de privacidad leídos; devuelve la sesión al día. */
export async function acceptTerms(version: AcceptTermsRequest['version']): Promise<CurrentUserResponse> {
  const { data } = await api.post<CurrentUserResponse>('/auth/me/terms', { version })
  return data
}

export async function changeOwnPassword(payload: ChangeOwnPasswordRequest): Promise<void> {
  await api.post('/auth/me/password', payload)
}

/**
 * Canjea el codigo de vista previa por una sesion del local de muestra.
 *
 * Sale sin credencial siempre: la pestana de vista previa nunca manda la
 * sesion real del navegador, y si ya muestra otra vista previa (se pego un
 * enlace nuevo en su barra) tampoco manda esa, asi el 401 de un codigo
 * invalido, vencido o ya usado no cierra la vista previa que sigue abierta.
 *
 * `login` y el acceso de plataforma no lo necesitan: sus formularios solo se
 * muestran sin sesion abierta, asi que salen sin token.
 */
export async function exchangePreviewCode(payload: PreviewExchangeRequest): Promise<AccessTokenResponse> {
  const { data } = await api.post<AccessTokenResponse>('/auth/preview', payload, { withoutCredential: true })
  return data
}
