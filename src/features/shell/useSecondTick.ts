import { useEffect, useState } from 'react'

const SECOND_MS = 1000

/** La hora actual, al segundo: para una cuenta regresiva que se lee como un reloj. */
export function useSecondTick(): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, SECOND_MS)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

  return now
}
