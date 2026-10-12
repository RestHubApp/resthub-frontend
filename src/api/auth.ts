import { queryOptions } from '@tanstack/react-query'

import { send } from './client'
import type {
  AcceptTermsRequest,
  AccessTokenResponse,
  ChangeOwnPasswordRequest,
  StaffSession,
  LoginRequest,
  PreviewExchangeRequest,
  Session,
  StaffAccessTokenResponse,
} from './types'

export const currentUserQueryKey = ['auth', 'me'] as const

/**
 * La sesión que trae una respuesta con token del personal: la cuenta, su
 * restaurante, sus permisos y si es una vista previa. Es lo mismo que devuelve
 * `GET /auth/me` para una cuenta del personal.
 */
export function staffSessionOf(response: StaffAccessTokenResponse): StaffSession {
  const { user, restaurant, permissions, preview: isPreview, terms_version, terms_accepted } = response
  return { kind: 'staff', user, restaurant, permissions, preview: isPreview, terms_version, terms_accepted }
}

/**
 * La sesión que trae una respuesta con token, sea de una cuenta del personal o
 * de la administración del sistema (`kind`).
 */
export function sessionOf(response: AccessTokenResponse): Session {
  if (response.kind === 'staff') {
    return staffSessionOf(response)
  }
  const { admin, permissions, preview: isPreview } = response
  return { kind: 'platform', admin, permissions, preview: isPreview }
}

/** El token y, en la misma respuesta, la sesión: la del personal o la de la administración del sistema. */
export async function login(payload: LoginRequest): Promise<AccessTokenResponse> {
  return send((client) => client.POST('/api/v1/auth/login', { body: payload }))
}

/** Un token nuevo para la sesion actual (de cualquiera de las dos clases), pedido antes de que venza el que hay. */
export async function renewSession(): Promise<AccessTokenResponse> {
  return send((client) => client.POST('/api/v1/auth/refresh'))
}

/** La sesión al día (del personal o de plataforma). `background`: si falla, no avisa en el armazón (ver `useAccountRefresh`). */
export async function fetchCurrentUser({ background = false } = {}): Promise<Session> {
  return send((client) => client.GET('/api/v1/auth/me'), { background })
}

/** Acepta los términos y la política de privacidad leídos; devuelve la sesión al día. */
export async function acceptTerms(version: AcceptTermsRequest['version']): Promise<StaffSession> {
  return send((client) => client.POST('/api/v1/auth/me/terms', { body: { version } }))
}

/**
 * Cambia la contraseña propia. El servidor corta todos los tokens anteriores,
 * el de esta petición incluido, y devuelve el único válido con la sesión (la
 * misma forma que el acceso).
 */
export async function changeOwnPassword(payload: ChangeOwnPasswordRequest): Promise<StaffAccessTokenResponse> {
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
 * `login` no lo necesita: su formulario solo se muestra sin sesion abierta,
 * asi que sale sin token.
 */
export async function exchangePreviewCode(payload: PreviewExchangeRequest): Promise<StaffAccessTokenResponse> {
  return send((client) => client.POST('/api/v1/auth/preview', { body: payload }), { withoutCredential: true })
}

/** La cuenta en curso, releida en segundo plano: un fallo no muestra aviso. */
export const currentUserQuery = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: () => fetchCurrentUser({ background: true }),
})
