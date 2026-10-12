// Señales de cancelación.

/**
 * Una señal que se aborta cuando se aborta cualquiera de las dos.
 *
 * `AbortSignal.any` no existe antes de Safari 17.4 ni de Chrome 116, y en el
 * celular viejo de un mesero el canal de avisos fallaba al conectar y se
 * quedaba reintentando sin abrir nunca. Ahí se combinan a mano.
 */
export function anyOf(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([a, b])
  }
  const combined = new AbortController()
  const abort = (origin: AbortSignal) => () => {
    combined.abort(origin.reason)
  }
  for (const signal of [a, b]) {
    if (signal.aborted) {
      combined.abort(signal.reason)
      break
    }
    signal.addEventListener('abort', abort(signal), { once: true, signal: combined.signal })
  }
  return combined.signal
}
