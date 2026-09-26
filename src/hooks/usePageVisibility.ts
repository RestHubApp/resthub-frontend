import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void): () => void {
  document.addEventListener('visibilitychange', onChange)
  return () => {
    document.removeEventListener('visibilitychange', onChange)
  }
}

function snapshot(): DocumentVisibilityState {
  return document.visibilityState
}

/** Si la pestaña está a la vista (`visible`) o en el fondo (`hidden`), y se actualiza al cambiar. */
export function usePageVisibility(): DocumentVisibilityState {
  return useSyncExternalStore(subscribe, snapshot)
}
