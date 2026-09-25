import { type RefObject, useLayoutEffect, useRef, useState } from 'react'

/**
 * El ancho de un elemento, al día cuando la ventana o el panel cambian.
 *
 * Los gráficos dibujan su SVG en píxeles reales (y no estirando un viewBox)
 * para que el texto de los ejes no se deforme ni cambie de tamaño.
 */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const elemento = ref.current
    if (elemento === null) {
      return undefined
    }
    setWidth(elemento.getBoundingClientRect().width)
    const observer = new ResizeObserver((entradas) => {
      for (const entrada of entradas) {
        setWidth(entrada.contentRect.width)
      }
    })
    observer.observe(elemento)
    return () => {
      observer.disconnect()
    }
  }, [])

  return [ref, width]
}
