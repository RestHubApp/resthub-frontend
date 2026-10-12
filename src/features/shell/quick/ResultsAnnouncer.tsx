import { useCommandState } from 'cmdk'
import { useEffect, useState } from 'react'

const ANNOUNCE_DELAY_MS = 400

/** Cuántas opciones quedan, dicho en voz alta con un breve retraso para no hablar tecla por tecla. */
export function ResultsAnnouncer({ search }: { readonly search: string }) {
  const count = useCommandState((state) => state.filtered.count)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (count > 0) {
        setMessage(count === 1 ? '1 resultado' : `${String(count)} resultados`)
      } else {
        setMessage(`Nada coincide con «${search.trim()}»`)
      }
    }, ANNOUNCE_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [count, search])

  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  )
}
