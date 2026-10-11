import { useEffect, useRef } from 'react'

import { logger } from '@/services/logger'
import { tokenExpiresAt } from '@/services/tokenExpiry'

// Se renueva unos minutos antes de que venza, con margen para un celular lento.
const MARGIN_MS = 5 * 60_000
// Solo se renueva si alguien usó la pantalla hace poco: una tablet olvidada
// en la barra no tiene por qué quedar con la sesión abierta para siempre.
const INACTIVITY_MS = 30 * 60_000
const EVENTS = ['pointerdown', 'keydown', 'visibilitychange'] as const

const activity = { last: Date.now() }

function markActivity(): void {
  activity.last = Date.now()
}

/**
 * Renueva un token antes de que venza mientras la aplicación se esté usando.
 *
 * Lo usan la sesión del restaurante y la del administrador del sistema, cada
 * una con su propio pedido de renovación. Si la renovación falla, no pasa
 * nada: la sesión sigue hasta su vencimiento y ahí se cierra como siempre.
 * `renew` puede cambiar en cada render sin reprogramar la renovación.
 *
 * `renew` recibe el token que se está renovando: si mientras viajaba la
 * petición se cerró la sesión o entró otra cuenta, la respuesta ya no es de
 * la sesión abierta y el almacén la descarta.
 */
export function useTokenRenewal(token: string | null, renew: (origin: string) => Promise<void>): void {
  const renewRef = useRef(renew)
  useEffect(() => {
    renewRef.current = renew
  })

  useEffect(() => {
    for (const event of EVENTS) {
      window.addEventListener(event, markActivity, { passive: true })
    }
    return () => {
      for (const event of EVENTS) {
        window.removeEventListener(event, markActivity)
      }
    }
  }, [])

  useEffect(() => {
    const origin = token
    const expiry = origin === null ? null : tokenExpiresAt(origin)
    if (origin === null || expiry === null) {
      return
    }
    const handleRenew = async () => {
      if (Date.now() - activity.last > INACTIVITY_MS) {
        return
      }
      try {
        await renewRef.current(origin)
      } catch (error) {
        logger.warn({ error: String(error) }, 'auth.renew_failed')
      }
    }
    const timer = window.setTimeout(() => void handleRenew(), Math.max(expiry - Date.now() - MARGIN_MS, 0))
    return () => {
      window.clearTimeout(timer)
    }
  }, [token])
}
