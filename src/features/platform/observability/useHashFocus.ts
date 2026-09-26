import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * Lleva a la sección que nombra el `#` de la dirección y le pasa el foco.
 *
 * El router no desplaza solo a un ancla. Corre en cada navegación con ancla
 * (un enlace de un log a sus peticiones), no al cambiar un filtro, que no la
 * lleva.
 */
export function useHashFocus(): void {
  const { hash, key } = useLocation()
  useEffect(() => {
    if (hash === '') {
      return
    }
    const destino = document.getElementById(decodeURIComponent(hash.slice(1)))
    destino?.scrollIntoView({ block: 'start' })
    destino?.focus({ preventScroll: true })
  }, [hash, key])
}
