import { useSyncExternalStore } from 'react'

/** `connecting` al abrir, `live` con el canal activo, `offline` mientras reintenta. */
export type LiveStatus = 'connecting' | 'live' | 'offline'

// El estado del canal de avisos (`GET /events`) de cada pantalla que lo tiene
// abierto, para que el armazón muestre si la pantalla se actualiza sola sin
// abrir una conexión propia. Puede haber más de una a la vez (la toma de
// pedido dentro del tablero): manda la peor.

type Listener = () => void
const listeners = new Set<Listener>()
const channels = new Map<symbol, LiveStatus>()
const WORST_FIRST: readonly LiveStatus[] = ['offline', 'connecting', 'live']

/** Anota el estado de un canal; `null` lo da por cerrado. */
export function reportLiveStatus(channel: symbol, status: LiveStatus | null): void {
  if (status === null) {
    channels.delete(channel)
  } else {
    channels.set(channel, status)
  }
  for (const listener of listeners) {
    listener()
  }
}

/** El peor estado entre los canales abiertos, o `null` si ninguna pantalla tiene uno. */
function currentLiveStatus(): LiveStatus | null {
  const open = new Set(channels.values())
  return WORST_FIRST.find((status) => open.has(status)) ?? null
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** El estado del canal en vivo, al día con cada cambio. */
export function useLiveStatus(): LiveStatus | null {
  return useSyncExternalStore(subscribe, currentLiveStatus, currentLiveStatus)
}
