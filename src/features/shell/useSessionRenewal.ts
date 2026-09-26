import { useEffect } from 'react'

import { renewSession } from '../../api/auth'
import { logger } from '../../services/logger'
import { useSession, venceEn } from '../../store/session'

// Se renueva unos minutos antes de que venza, con margen para un celular lento.
const MARGEN_MS = 5 * 60_000
// Solo se renueva si alguien usó la pantalla hace poco: una tablet olvidada
// en la barra no tiene por qué quedar con la sesión abierta para siempre.
const INACTIVIDAD_MS = 30 * 60_000
const EVENTOS = ['pointerdown', 'keydown', 'visibilitychange'] as const

const actividad = { ultima: Date.now() }

function marcarActividad(): void {
  actividad.ultima = Date.now()
}

/**
 * Renueva el token antes de que venza mientras la aplicación se esté usando.
 *
 * El token dura una hora: sin esto, el mesero tendría que volver a entrar a
 * mitad del turno. Si la renovación falla, no pasa nada: la sesión sigue hasta
 * su vencimiento y ahí se cierra como siempre.
 */
export function useSessionRenewal(): void {
  const token = useSession((state) => state.token)
  const renew = useSession((state) => state.renew)

  useEffect(() => {
    for (const evento of EVENTOS) {
      window.addEventListener(evento, marcarActividad, { passive: true })
    }
    return () => {
      for (const evento of EVENTOS) {
        window.removeEventListener(evento, marcarActividad)
      }
    }
  }, [])

  useEffect(() => {
    const vencimiento = token === null ? null : venceEn(token)
    if (vencimiento === null) {
      return
    }
    const renovar = async () => {
      if (Date.now() - actividad.ultima > INACTIVIDAD_MS) {
        return
      }
      try {
        const nuevo = await renewSession()
        renew(nuevo.access_token, { user: nuevo.user, restaurant: nuevo.restaurant, permissions: nuevo.permissions })
      } catch (error) {
        logger.warn({ error: String(error) }, 'auth.renew_failed')
      }
    }
    const timer = window.setTimeout(() => void renovar(), Math.max(vencimiento - Date.now() - MARGEN_MS, 0))
    return () => {
      window.clearTimeout(timer)
    }
  }, [token, renew])
}
