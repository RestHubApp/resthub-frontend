export type ApiFailureScope = 'platform' | 'restaurant'

interface ApiFailure {
  readonly scope: ApiFailureScope
  readonly message: string
}

let actual: ApiFailure | null = null
const oyentes = new Set<() => void>()

function avisar(): void {
  for (const oyente of oyentes) oyente()
}

/** Recuerda el último corte del API para las pantallas que no repiten la consulta. */
export function noteApiFailure(scope: ApiFailureScope, message: string): void {
  actual = { scope, message }
  avisar()
}

export function clearApiFailure(): void {
  if (actual === null) return
  actual = null
  avisar()
}

export function subscribeApiFailure(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

export function apiFailureMessage(scope: ApiFailureScope): string | null {
  return actual?.scope === scope ? actual.message : null
}
