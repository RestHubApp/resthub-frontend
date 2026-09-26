import { useEffect, useState } from 'react'

const SEGUNDO_MS = 1000

/** La hora actual, al segundo: para una cuenta regresiva que se lee como un reloj. */
export function useSecondTick(): number {
  const [ahora, setAhora] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAhora(Date.now())
    }, SEGUNDO_MS)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return ahora
}
