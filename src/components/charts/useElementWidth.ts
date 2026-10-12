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
    const element = ref.current
    if (element === null) {
      return undefined
    }
    setWidth(element.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [])

  return [ref, width]
}
