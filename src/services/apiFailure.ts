let actual: string | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

/** Recuerda el último corte del API para las pantallas que no repiten la consulta. */
export function noteApiFailure(message: string): void {
  actual = message
  notify()
}

export function clearApiFailure(): void {
  if (actual === null) return
  actual = null
  notify()
}

export function subscribeApiFailure(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function apiFailureMessage(): string | null {
  return actual
}
