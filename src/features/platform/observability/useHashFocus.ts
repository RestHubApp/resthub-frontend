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
    // eslint-disable-next-line security/detect-possible-timing-attacks -- compara el hash de la URL con '', no con un secreto
    if (hash === '') {
      return
    }
    const destino = document.getElementById(decodeURIComponent(hash.slice(1)))
    destino?.scrollIntoView({ block: 'start' })
    destino?.focus({ preventScroll: true })
  }, [hash, key])
}
