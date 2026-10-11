import { beforeEach, describe, expect, it } from '@jest/globals'

import { buildAccount, PERMISSIONS_WAITER, signInAs } from '#jest/harness'
import { sessionOf } from '@/api/auth'
import type { AccessTokenResponse } from '@/api/types'
import { useSession } from '@/store/session'
import { followWithNewToken } from './changePasswordSession'

function responseWith(token: string): AccessTokenResponse {
  return { access_token: token, token_type: 'bearer', expires_in: 3600, ...buildAccount(PERMISSIONS_WAITER) }
}

describe('followWithNewToken', () => {
  beforeEach(() => {
    signInAs(PERMISSIONS_WAITER)
  })

  it('adopta el token nuevo cuando la sesión sigue siendo la de origen', () => {
    const origin = useSession.getState().token
    const response = responseWith('token-renovado')

    expect(followWithNewToken(response, origin)).toBe('renovada')
    expect(useSession.getState().token).toBe('token-renovado')
    expect(sessionOf(response).user.id).toBe(useSession.getState().account?.user.id)
  })

  it('cierra la sesión si el servidor no devolvió token', () => {
    const origin = useSession.getState().token

    expect(followWithNewToken(responseWith(''), origin)).toBe('cerrada')
    expect(useSession.getState().token).toBeNull()
    expect(useSession.getState().passwordChanged).toBe(true)
  })

  it('no toca la sesión si otra pestaña ya entró con otra', () => {
    expect(followWithNewToken(responseWith(''), 'token-de-origen')).toBe('ajena')
    expect(useSession.getState().token).not.toBeNull()
  })
})
