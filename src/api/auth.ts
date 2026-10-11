import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
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
  const { user, restaurant, permissions, preview: isPreview, terms_version, terms_accepted } = response
  return { user, restaurant, permissions, preview: isPreview, terms_version, terms_accepted }
}

/** El token y, en la misma respuesta, la cuenta, su restaurante y sus permisos. */
export async function login(payload: LoginRequest): Promise<AccessTokenResponse> {
  return send((client) => client.POST('/api/v1/auth/login', { body: payload }))
}

/** Un token nuevo para la sesion actual, pedido antes de que venza el que hay. */
export async function renewSession(): Promise<AccessTokenResponse> {
  return send((client) => client.POST('/api/v1/auth/refresh'))
}

/** La sesión al día. `background`: si falla, no avisa en el armazón (ver `useAccountRefresh`). */
export async function fetchCurrentUser({ background = false } = {}): Promise<CurrentUserResponse> {
  return send((client) => client.GET('/api/v1/auth/me'), { background })
}

/** Acepta los términos y la política de privacidad leídos; devuelve la sesión al día. */
export async function acceptTerms(version: AcceptTermsRequest['version']): Promise<CurrentUserResponse> {
  return send((client) => client.POST('/api/v1/auth/me/terms', { body: { version } }))
}

/**
 * Cambia la contraseña propia. El servidor corta todos los tokens anteriores,
 * el de esta petición incluido, y devuelve el único válido con la sesión (la
 * misma forma que el acceso).
 */
export async function changeOwnPassword(payload: ChangeOwnPasswordRequest): Promise<AccessTokenResponse> {
  return send((client) => client.POST('/api/v1/auth/me/password', { body: payload }))
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
  return send((client) => client.POST('/api/v1/auth/preview', { body: payload }), { withoutCredential: true })
}

/** La cuenta en curso, releida en segundo plano: un fallo no muestra aviso. */
export const currentUserQuery = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: () => fetchCurrentUser({ background: true }),
})
