import type { Session } from '@/api/types'
import { logger } from '@/services/logger'
import { isPreviewTab } from '@/services/tabStorage'
import { tokenExpiresAt } from '@/services/tokenExpiry'
import { persistence, readSaved, type StoredSession } from './sessionStorageAccess'

/**
 * La sesión abierta en esta pestaña más allá del token: la marca del inicio de
 * sesión y cuándo vence. Es lo que se guarda en el navegador en lugar del token.
 */
export const opened: { tag: string | null; expiresAt: number | null } = { tag: null, expiresAt: null }

/** Una marca nueva para un inicio de sesión: no es secreta, solo distinta de la anterior. */
function newTag(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Anota un inicio de sesión nuevo con su marca. */
export function openRecord(): void {
  opened.tag = newTag()
}

/** Anota la sesión que esta pestaña tomó de lo guardado; `null` la olvida. */
export function adoptRecord(stored: StoredSession | null): void {
  opened.tag = stored?.tag ?? null
  opened.expiresAt = stored?.expiresAt ?? null
}

/** Anota cuándo vence el token y devuelve ese momento. */
export function noteExpiry(token: string): number | null {
  opened.expiresAt = tokenExpiresAt(token)
  return opened.expiresAt
}

/** Lo que se guarda de la sesión abierta: el token solo en una vista previa, que no tiene cookie. */
export function recordOf(account: Session, token: string | null): StoredSession {
  const record: StoredSession = { tag: opened.tag ?? '', expiresAt: opened.expiresAt, account }
  return isPreviewTab() && token !== null ? { ...record, token } : record
}

/** Si lo guardado se puede seguir usando: vigente y, en una vista previa, marcado como tal y con su token. */
export function isCurrent(stored: StoredSession | null): stored is StoredSession {
  if (stored === null || typeof stored.tag !== 'string' || stored.tag === '') {
    return false
  }
  const isAlive = stored.expiresAt === null || stored.expiresAt > Date.now()
  return isAlive && (!isPreviewTab() || (stored.account.preview && typeof stored.token === 'string'))
}

function accountId(account: Session): number {
  return account.kind === 'platform' ? account.admin.id : account.user.id
}

/** Si la sesión guardada es de la misma cuenta (y, en el personal, del mismo local) que esta pestaña. */
function isSameAccount(stored: StoredSession, account: Session): boolean {
  if (stored.account.kind === 'platform' || account.kind === 'platform') {
    return stored.account.kind === account.kind && accountId(stored.account) === accountId(account)
  }
  return accountId(stored.account) === accountId(account) && stored.account.restaurant.id === account.restaurant.id
}

/** Si lo guardado se puede adoptar: sigue vigente y es de la misma cuenta (o esta pestaña no tenía ninguna). */
export function canAdoptStoredSession(stored: StoredSession | null, account: Session | null): stored is StoredSession {
  return isCurrent(stored) && (account === null || isSameAccount(stored, account))
}

/**
 * Si otra pestana cambio la sesion guardada despues de que esta guardo la
 * suya: la cerro o entro de nuevo. Entonces esta pestana no debe escribir
 * encima; lo guardado manda. Una vista previa vive en su propia pestana y
 * ninguna otra la toca.
 */
export function otherTabChange(): boolean {
  const written = persistence.tag
  if (isPreviewTab() || written === null || written !== opened.tag) {
    return false
  }
  const read = readSaved()
  return read.ok && read.session?.tag !== written
}

export function logSignedIn(account: Session): void {
  if (account.kind === 'platform') {
    logger.info({ adminId: account.admin.id }, 'auth.signed_in')
    return
  }
  logger.info({ userId: account.user.id, roleId: account.user.role_id, restaurantId: account.restaurant.id }, 'auth.signed_in')
}
