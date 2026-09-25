import { useEffect, useState } from 'react'

/**
 * La hora actual, refrescada cada tanto.
 *
 * Los tiempos del tablero se miden en minutos: refrescar cada segundo solo
 * repintaria todas las tarjetas sin cambiar nada de lo que se lee.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, intervalMs)
    return () => {
      window.clearInterval(timer)
    }
  }, [intervalMs])

  return now
}
