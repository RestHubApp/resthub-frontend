import { queryOptions } from '@tanstack/react-query'

import { setCsrfRecovery, setCsrfToken } from '@/services/apiCredentials'
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
  const { user, restaurant, permissions, preview: isPreview, terms_version, terms_accepted, privacy_version, privacy_accepted } = response
  const { must_change_password, idle_lock_minutes, has_pin, session_locked, two_factor_setup_required } = response
  // El acceso manda `two_factor_setup_required` en `false`: si a quien administra el
  // personal le falta activarla, lo dicen `GET /auth/me` y el primer 403 (RFS-22).
  return {
    kind: 'staff', user, restaurant, permissions, preview: isPreview, terms_version, terms_accepted, privacy_version, privacy_accepted,
    must_change_password, idle_lock_minutes, has_pin, session_locked, two_factor_setup_required,
  }
}

/**
 * La sesión que trae una respuesta con token, sea de una cuenta del personal o
 * de la administración del sistema (`kind`).
 */
export function sessionOf(response: AccessTokenResponse): Session {
  if (response.kind === 'staff') {
    return staffSessionOf(response)
  }
  const { admin, permissions, preview: isPreview, must_change_password } = response
  // El acceso no dice si falta la verificación en dos pasos: lo dicen `GET
  // /auth/me` y el primer 403 `two_factor_setup_required` (RFS-22).
  return { kind: 'platform', admin, permissions, preview: isPreview, two_factor_setup_required: false, must_change_password }
}

/**
 * Anota el valor anti-CSRF que trae una respuesta (S2) y la devuelve. El
 * servidor deja la sesión también en una cookie `HttpOnly`; ese valor es lo
 * único de ella que la página puede leer, y lo exige en lo que cambia algo.
 */
function withCsrf<TResponse extends { csrf_token?: string | null }>(response: TResponse): TResponse {
  // Un servidor viejo respondía 204 sin cuerpo al cambiar la contraseña.
  const body = response as Partial<TResponse> | null
  setCsrfToken(body?.csrf_token)
  return response
}

/** El token y, en la misma respuesta, la sesión: la del personal o la de la administración del sistema. */
export async function login(payload: LoginRequest): Promise<AccessTokenResponse> {
  return withCsrf(await send((client) => client.POST('/api/v1/auth/login', { body: payload })))
}

/** Un token nuevo para la sesion actual (de cualquiera de las dos clases), pedido antes de que venza el que hay. */
export async function renewSession(): Promise<AccessTokenResponse> {
  return withCsrf(await send((client) => client.POST('/api/v1/auth/refresh')))
}

/** La sesión al día (del personal o de plataforma). `background`: si falla, no avisa en el armazón (ver `useAccountRefresh`). */
export async function fetchCurrentUser({ background = false } = {}): Promise<Session> {
  const { csrf_token: csrf, ...account } = await send((client) => client.GET('/api/v1/auth/me'), { background })
  setCsrfToken(csrf)
  return account
}

const sessionRestoreQueryKey = ['auth', 'restore'] as const

/**
 * Recupera la sesión de la cookie tras recargar la página: el token ya no se
 * guarda en el navegador. `GET /auth/me` da el valor anti-CSRF que la
 * renovación necesita, y la renovación, un token para esta pestaña. Sin cookie
 * (el navegador la bloquea, o venció) responde 401 y la sesión se cierra.
 */
async function restoreSession(): Promise<AccessTokenResponse> {
  await fetchCurrentUser({ background: true })
  return renewSession()
}

/**
 * La recuperación como consulta: TanStack Query la reintenta sin red y no la
 * repite mientras ya viaja. No se guarda (`gcTime: 0`): cada token que falte
 * se recupera de nuevo.
 */
export const sessionRestoreQuery = queryOptions({
  queryKey: sessionRestoreQueryKey,
  queryFn: restoreSession,
  gcTime: 0,
  staleTime: 0,
  meta: { background: true },
})

// Si otra pestaña renovó la cookie, el valor anti-CSRF de esta ya no coincide:
// se relee de `GET /auth/me`, que no lo exige.
setCsrfRecovery(async () => {
  try {
    await fetchCurrentUser({ background: true })
    return true
  } catch {
    return false
  }
})

/** Acepta, por separado, los términos y el tratamiento de datos leídos; devuelve la sesión al día. */
export async function acceptTerms(versions: AcceptTermsRequest): Promise<StaffSession> {
  return send((client) => client.POST('/api/v1/auth/me/terms', { body: versions }))
}

/**
 * Cambia la contraseña propia, del personal o de la administración del
 * sistema. El servidor corta todos los tokens anteriores, el de esta petición
 * incluido, y devuelve el único válido con la sesión: la misma forma que el
 * acceso, distinguida por `kind`.
 */
export async function changeOwnPassword(payload: ChangeOwnPasswordRequest): Promise<AccessTokenResponse> {
  return withCsrf(await send((client) => client.POST('/api/v1/auth/me/password', { body: payload })))
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

/** Cuánto se espera, como máximo, el aviso de salida: cerrar la sesión no depende de él. */
const SIGN_OUT_NOTICE_TIMEOUT_MS = 3000

/**
 * Avisa al servidor que esta cuenta sale: cierra la sesión de este dispositivo
 * (su token deja de servir), borra la cookie de sesión y, en el personal, lo
 * deja en la bitácora. Lleva el `token` que se está por descartar (sin él, tras
 * recargar, viaja la cookie) y nunca rechaza: sin red o con un error, la salida
 * sigue igual y la sesión vence sola.
 */
export async function reportSignOut(token: string | null): Promise<void> {
  try {
    await send((client) => client.POST('/api/v1/auth/logout'), {
      credential: token,
      background: true,
      timeout: SIGN_OUT_NOTICE_TIMEOUT_MS,
    })
  } catch {
    // El aviso es de cortesía: no hay nada que hacer si no llegó.
  }
}

/**
 * Bloquea la sesión de este dispositivo (RFS-29). Vive aquí y no con el resto de
 * la seguridad de la cuenta porque la usa el armazón, que se descarga siempre.
 */
export async function lockOwnSession(): Promise<void> {
  try {
    await send((client) => client.POST('/api/v1/auth/me/lock'), { background: true })
  } catch {
    // Sin red la pantalla se bloquea igual; el servidor la bloquea solo al ver la inactividad.
  }
}

/** La cuenta en curso, releida en segundo plano: un fallo no muestra aviso. */
export const currentUserQuery = queryOptions({
  queryKey: currentUserQueryKey,
  queryFn: () => fetchCurrentUser({ background: true }),
})
