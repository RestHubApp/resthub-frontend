import { useSyncExternalStore } from 'react'

const FINE = '(pointer: fine)'

function subscribe(onChange: () => void): () => void {
  const media = typeof window.matchMedia === 'function' ? window.matchMedia(FINE) : null
  media?.addEventListener('change', onChange)
  return () => {
    media?.removeEventListener('change', onChange)
  }
}

function read(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(FINE).matches
}

/**
 * Si el dispositivo se maneja con un puntero fino (ratón o panel táctil).
 *
 * La densidad compacta solo vale ahí: con el dedo los controles miden siempre
 * 44 px, así que la pantalla ni ofrece elegirla.
 */
export function useFinePointer(): boolean {
  return useSyncExternalStore(subscribe, read, () => false)
}
