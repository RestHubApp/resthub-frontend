import { useEffect } from 'react'

import { lockOwnSession } from '@/api/accountSecurity'
import { useSession, useStaffAccount } from '@/store/session'

// Lo que cuenta como uso: tocar, escribir, hacer clic o desplazarse.
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const
// Cada cuánto se mira el reloj. Se compara con la hora y no con un temporizador
// largo: un celular que se duerme no corre los temporizadores.
const CHECK_MS = 15_000
const MINUTE_MS = 60_000

/** Los minutos sin uso tras los que se bloquea la sesión; 0 si no se bloquea. */
function idleMinutesOf(minutes: unknown): number {
  return typeof minutes === 'number' && minutes > 0 ? minutes : 0
}

/**
 * Bloquea la sesión del personal tras los minutos sin uso que eligió el
 * restaurante (RFS-29). El servidor bloquea solo la sesión que vuelve después
 * de ese tiempo, pero las lecturas de fondo (la cuenta, el canal de avisos)
 * siguen llegando aunque nadie toque la pantalla: por eso el armazón cuenta
 * el uso de verdad y avisa al servidor que bloquee.
 */
export function useIdleLock(): void {
  const account = useStaffAccount()
  const minutes = account === null || account.preview || account.session_locked ? 0 : idleMinutesOf(account.idle_lock_minutes)

  useEffect(() => {
    if (minutes === 0) return undefined
    let lastUse = Date.now()
    const markUse = () => {
      lastUse = Date.now()
    }
    const timer = setInterval(() => {
      if (Date.now() - lastUse < minutes * MINUTE_MS) return
      useSession.getState().setLocked(true)
      void lockOwnSession()
    }, CHECK_MS)
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, markUse, { passive: true })
    return () => {
      clearInterval(timer)
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, markUse)
    }
  }, [minutes])
}
