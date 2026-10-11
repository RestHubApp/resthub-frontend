export type ApiFailureScope = 'platform' | 'restaurant'

interface ApiFailure {
  readonly scope: ApiFailureScope
  readonly message: string
}

let actual: ApiFailure | null = null
const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) listener()
}

/** Recuerda el último corte del API para las pantallas que no repiten la consulta. */
export function noteApiFailure(scope: ApiFailureScope, message: string): void {
  actual = { scope, message }
  notify()
}

export function clearApiFailure(): void {
  if (actual === null) return
  actual = null
  notify()
}

/** Una lectura de ese ámbito respondió: el corte que se recordaba ya pasó. */
export function clearApiFailureOf(scope: ApiFailureScope): void {
  if (actual?.scope === scope) clearApiFailure()
}

export function subscribeApiFailure(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function apiFailureMessage(scope: ApiFailureScope): string | null {
  return actual?.scope === scope ? actual.message : null
}
