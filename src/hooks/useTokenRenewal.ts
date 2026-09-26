import { useEffect, useRef } from 'react'

import { logger } from '../services/logger'
import { tokenExpiresAt } from '../services/tokenExpiry'

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
  const renovarRef = useRef(renew)
  useEffect(() => {
    renovarRef.current = renew
  })

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
    const origen = token
    const vencimiento = origen === null ? null : tokenExpiresAt(origen)
    if (origen === null || vencimiento === null) {
      return
    }
    const renovar = async () => {
      if (Date.now() - actividad.ultima > INACTIVIDAD_MS) {
        return
      }
      try {
        await renovarRef.current(origen)
      } catch (error) {
        logger.warn({ error: String(error) }, 'auth.renew_failed')
      }
    }
    const timer = window.setTimeout(() => void renovar(), Math.max(vencimiento - Date.now() - MARGEN_MS, 0))
    return () => {
      window.clearTimeout(timer)
    }
  }, [token])
}
