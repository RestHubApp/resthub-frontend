import { useCallback, useSyncExternalStore } from 'react'

/**
 * Si la pantalla cumple una condición de CSS (`(min-width: 1024px)`), y se
 * entera cuando cambia, por ejemplo al girar el celular.
 *
 * Sin `matchMedia` (pruebas, navegadores muy viejos) contesta que no.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (notify: () => void) => {
      if (typeof window.matchMedia !== 'function') {
        return () => undefined
      }
      const list = window.matchMedia(query)
      list.addEventListener('change', notify)
      return () => {
        list.removeEventListener('change', notify)
      }
    },
    [query],
  )
  const read = () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches

  return useSyncExternalStore(subscribe, read, () => false)
}
